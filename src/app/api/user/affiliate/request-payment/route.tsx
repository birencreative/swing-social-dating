import { dbPool } from '@/lib/db';
import FormData from "form-data";
import Mailgun from "mailgun.js";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  let client: any = null;

  try {
    const data = await req.json();

    const {
      profileId,
      affiliateCode,
      yourName,
      email,
      payoutMethod,
      paypalEmail,
      achBankName,
      achAccountType,
      achRoutingNumber,
      achAccountNumber,
      totalAmount,
    } = data;

    if (!profileId || !affiliateCode || !email) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    client = await dbPool.connect();

    const checkPending = await client.query(
      `
      SELECT 1 FROM "AffiliatePaymentRequest"
      WHERE "ProfileId" = $1 AND "Status" = 'pending'
      LIMIT 1
      `,
      [profileId]
    );

    if (checkPending.rowCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have a pending payout request.",
        },
        { status: 200 }
      );
    }

    const payoutDetailsJson = {
      payoutMethod,
      paypalEmail,
      achBankName,
      achAccountType,
      achRoutingNumber,
      achAccountNumber
    };

    const insertRes = await client.query(
      `
      INSERT INTO "AffiliatePaymentRequest" (
        "ProfileId",
        "AffiliateCode",
        "YourName",
        "BusinessName",
        "MakePayableTo",
        "Email",
        "Phone",
        "Address",
        "City",
        "State",
        "Postal",
        "Country",
        "PaymentEmail",
        "TaxIndividual",
        "TaxBusiness",
        "PayoutDetails",
        "Status",
        "CreatedAt"
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'pending',NOW()
      )
      RETURNING "Id"
      `,
      [
        profileId,
        affiliateCode,
        yourName,
        null, // businessName
        null, // makePayableTo
        email,
        null, // phone
        null, // address
        null, // city
        null, // state
        null, // postal
        null, // country
        null, // paymentEmail
        null, // taxIndividual
        null, // taxBusiness
        JSON.stringify(payoutDetailsJson)
      ]
    );

    const configResult = await client.query(
      'SELECT "ConfigValue" FROM "Configuration" WHERE "ConfigName" = $1',
      ["EmailApi"]
    );

    const mailgunKey = configResult.rows[0]?.ConfigValue;
    if (!mailgunKey) {
      throw new Error("MAILGUN_KEY not found in configuration");
    }

    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: "api",
      key: mailgunKey,
    });

    function infoRowDark(label: string, value: string) {
      return `
  <tr>
    <td style="
      padding:8px 0 2px;
      font-size:12px;
      color:#ff9fc9;
      font-weight:600;
    ">
      ${label}
    </td>
  </tr>
  <tr>
    <td style="
      padding:0 0 10px;
      font-size:14px;
      color:#ffffff;
      word-break:break-word;
    ">
      ${value || "-"}
    </td>
  </tr>
  `;
    }

    const LOGO_URL = "https://app.swingsocial.co/logo.png";

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
</head>

<body style="
  margin:0;
  padding:0;
  background:#0b0b12;
  font-family:Arial, Helvetica, sans-serif;
  color:#ffffff;
">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:16px 8px;">
  <tr>
    <td align="center">

      <!-- CARD -->
      <table width="100%" cellpadding="0" cellspacing="0"
        style="
          max-width:560px;
          background:#11111b;
          border-radius:18px;
          overflow:hidden;
          border:1px solid rgba(255,255,255,0.08);
        "
      >

        <!-- HEADER -->
        <tr>
          <td style="
            background:linear-gradient(135deg,#ff5fa2,#ff006e);
            padding:18px 16px;
            text-align:center;
          ">
            <img
              src="${LOGO_URL}"
              alt="SwingSocial"
              width="180"
              style="display:block;margin:0 auto 8px;"
            />

            <div style="font-size:30px;">💖</div>

            <h2 style="
              margin:6px 0 4px;
              font-size:20px;
              font-weight:700;
              color:#ffffff;
            ">
              Payout Confirmation & Invoice
            </h2>

            <p style="margin:0;font-size:13px;opacity:0.95;">
              Your requested payout is actively processing
            </p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:18px 16px;">

            <p style="margin-top:0;font-size:14px;">
              Hi <strong>${yourName || "Affiliate"}</strong>,
            </p>

            <p style="color:#d6d6e0;font-size:13px;line-height:1.5;">
              Your automated payout request has been received and is currently processing. 
              Below is the invoice summary of your payout request.
            </p>

            <!-- DETAILS -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="
                margin-top:14px;
                padding:4px;
              "
            >
              ${infoRowDark("Payout Amount", `<b>$${totalAmount ? Number(totalAmount).toFixed(2) : "0.00"}</b>`)}
              ${infoRowDark("Affiliate Code", affiliateCode)}
              ${infoRowDark("Your Name", yourName)}
              ${infoRowDark("Email Address", email)}
              ${infoRowDark("Payout Method", payoutMethod === "paypal" ? "PayPal" : "Direct Deposit (ACH)")}
              ${payoutMethod === "paypal"
        ? infoRowDark("PayPal Email", paypalEmail || "-")
        : ""
      }
              ${payoutMethod === "ach"
        ? infoRowDark("Bank Name", achBankName || "-") +
        infoRowDark("Routing Number", "******" + (achRoutingNumber?.slice(-4) || "XXXX")) +
        infoRowDark("Account Number", "******" + (achAccountNumber?.slice(-4) || "XXXX"))
        : ""
      }
            </table>

            <!-- STATUS -->
            <div style="
              margin-top:16px;
              padding:12px;
              background:#16162a;
              border-radius:10px;
              font-size:12px;
              line-height:1.5;
            ">
              Depending on your payout method, funds will arrive in your account momentarily.
            </div>

            <p style="margin-top:18px;font-size:13px;">
              With love,<br/>
              <strong>Team SwingSocial 💕</strong>
            </p>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="
            text-align:center;
            padding:12px;
            font-size:11px;
            color:#a0a0b5;
            background:#0b0b12;
          ">
            Need help?
            <a href="mailto:info@swingsocial.co" style="color:#ff5fa2;">
              info@swingsocial.co
            </a>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>
`;

    await mg.messages.create("swingsocial.co", {
      from: "SwingSocial <info@swingsocial.co>",
      to: [
        // "falconsoftmobile@gmail.com",
        // "latuttle22@gmail.com",
        "baldhavansh2505@gmail.com",
        email,
      ],
      subject: "Payout Confirmation & Invoice 💖",
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: "Payout request submitted successfully.",
      requestId: insertRes.rows[0].Id
    });
  } catch (err: any) {
    console.error("Affiliate Request Payment API error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: err?.message,
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      try {
        client.release();
      } catch (e) {
        console.warn("Failed to release client:", e);
      }
    }
  }
}
