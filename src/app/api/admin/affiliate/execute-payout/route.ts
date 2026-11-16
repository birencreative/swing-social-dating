import { NextResponse } from "next/server";
import FormData from "form-data";
import Mailgun from "mailgun.js";
import paypal from "@paypal/payouts-sdk";
import { dbPool } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { paypalClient } from "@/lib/paypal";

export async function POST(req: Request) {
  let client: any = null;

  try {
    const { requestId, totalAmount } = await req.json();

    if (!requestId || !totalAmount) {
      return NextResponse.json(
        { success: false, message: "Missing requestId or totalAmount" },
        { status: 400 }
      );
    }

    client = await dbPool.connect();

    // Payment credentials and configurations are centralized in src/config/index.ts

    const requestRes = await client.query(
      `SELECT * FROM "AffiliatePaymentRequest" WHERE "Id" = $1 AND "Status" = 'pending' LIMIT 1`,
      [requestId]
    );

    if (requestRes.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid or already processed payout request ID." },
        { status: 400 }
      );
    }

    const payoutRequest = requestRes.rows[0];
    const payoutDetails = payoutRequest.PayoutDetails;

    if (!payoutDetails) {
      return NextResponse.json({ success: false, message: "No stored payout details found." }, { status: 400 });
    }

    const payoutMethod = payoutDetails.payoutMethod;

    console.log("payoutMethod", payoutMethod)

    async function finalizePayout(transactionId: string) {
      await client.query(`UPDATE "AffiliatePaymentRequest" SET "Status" = 'paid' WHERE "Id" = $1`, [requestId]);

      await client.query(
        `INSERT INTO "AffiliatePayoutHistory" ("ProfileId", "Amount", "PayoutMethod", "TransactionId", "Status") VALUES ($1, $2, $3, $4, 'paid')`,
        [payoutRequest.ProfileId, totalAmount, payoutMethod, transactionId]
      );

      const configResult = await client.query('SELECT "ConfigValue" FROM "Configuration" WHERE "ConfigName" = $1', ["EmailApi"]);
      const mailgunKey = configResult.rows[0]?.ConfigValue;

      if (mailgunKey) {
        const mailgun = new Mailgun(FormData);
        const mg = mailgun.client({ username: "api", key: mailgunKey });

        function infoRowDark(label: string, value: string) {
          return `
      <tr>
        <td style="padding:8px 0 2px;font-size:12px;color:#ff9fc9;font-weight:600;">${label}</td>
      </tr>
      <tr>
        <td style="padding:0 0 10px;font-size:14px;color:#ffffff;word-break:break-word;">${value || "-"}</td>
      </tr>`;
        }

        const emailHtml = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0b0b12;font-family:Arial, sans-serif;color:#ffffff;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:16px 8px;"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#11111b;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#ff5fa2,#ff006e);padding:18px 16px;text-align:center;">
        <img src="https://app.swingsocial.co/logo.png" alt="SwingSocial" width="180" style="display:block;margin:0 auto 8px;" />
        <div style="font-size:30px;">💸</div>
        <h2 style="margin:6px 0 4px;font-size:20px;font-weight:700;color:#ffffff;">Payment Formally Processed</h2>
        <p style="margin:0;font-size:13px;opacity:0.95;">Your payout has been transferred successfully</p>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 16px;">
        <p style="margin-top:0;font-size:14px;">Hi <strong>${payoutRequest.YourName || "Affiliate"}</strong>,</p>
        <p style="color:#d6d6e0;font-size:13px;line-height:1.5;">Below is the final invoice for your successfully transferred payout.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;padding:4px;">
          ${infoRowDark("Payout Amount", `<b>$${Number(totalAmount).toFixed(2)}</b>`)}
          ${infoRowDark("Transaction ID", transactionId)}
          ${infoRowDark("Payout Method", payoutMethod === "paypal" ? "PayPal" : "Direct Deposit (ACH)")}
          ${payoutMethod === "paypal" ? infoRowDark("PayPal Email", payoutDetails.paypalEmail) : ""}
        </table>
        <p style="margin-top:18px;font-size:13px;">With love,<br/><strong>Team SwingSocial 💕</strong></p>
      </td>
    </tr>
  </table>
</td></tr></table>
</body>
</html>`;

        await mg.messages.create("swingsocial.co", {
          from: "SwingSocial <info@swingsocial.co>",
          to: ["baldhavansh2505@gmail.com", payoutRequest.Email],
          subject: "Final Invoice: Payout Processed 💸",
          html: emailHtml,
        });
      }
    }

    // --- PAYPAL WORKFLOW ---
    if (payoutMethod === "paypal") {
      let pReq = new paypal.payouts.PayoutsPostRequest();
      pReq.requestBody({
        sender_batch_header: {
          sender_batch_id: `Payout_${requestId}_${Date.now()}`,
          email_subject: "You have a payout from SwingSocial!",
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: {
              value: parseFloat(totalAmount).toFixed(2),
              currency: "USD",
            },
            note: "Thanks for being a SwingSocial affiliate!",
            receiver: payoutDetails.paypalEmail,
            sender_item_id: `item_${requestId}`,
          },
        ],
      });

      const response = await paypalClient.execute(pReq);

      if (response.statusCode === 201) {
        const transactionId = response.result.batch_header.payout_batch_id;
        await finalizePayout(transactionId);
        return NextResponse.json({ success: true, message: "PayPal payout executed successfully", batchId: transactionId });
      } else {
        throw new Error("PayPal payout API returned unsuccessful logic.");
      }

      // --- STRIPE WORKFLOW (ACH) ---
    } else if (payoutMethod === "ach") {
      // ACH directly to routing number requires a Custom connected account on Stripe
      // Note: In production you MUST onboard users to Stripe Connect rather than storing raw ACH data locally due to compliance.
      // This is a simplified scaffold assuming a connected account workflow or standard transfer.

      // 1. Create a bank account token using the stored ACH details
      const bankAccountToken = await stripe.tokens.create({
        bank_account: {
          country: 'US',
          currency: 'usd',
          account_holder_name: payoutRequest.YourName,
          account_holder_type: 'individual',
          routing_number: payoutDetails.achRoutingNumber,
          account_number: payoutDetails.achAccountNumber,
        },
      });

      // 2. Create the connected Custom account (assuming one doesn't exist yet for this pseudo-example)
      const connectAccount = await stripe.accounts.create({
        type: 'custom',
        country: 'US',
        email: payoutRequest.Email,
        capabilities: {
          transfers: { requested: true },
        },
        external_account: bankAccountToken.id,
      });

      // 3. Transfer Funds
      const transfer = await stripe.transfers.create({
        amount: Math.round(parseFloat(totalAmount) * 100), // Stripe uses cents
        currency: "usd",
        destination: connectAccount.id,
        description: `SwingSocial Affiliate Payout: ${requestId}`,
      });

      // Mark as paid in DB
      await finalizePayout(transfer.id);
      return NextResponse.json({ success: true, message: "Stripe ACH Transfer processed.", transferId: transfer.id });

    } else {
      return NextResponse.json({ success: true, message: "Unknown payout method." });
    }

  } catch (err: any) {
    console.error("Execute Payout Error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to execute payout.", error: err.message },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
