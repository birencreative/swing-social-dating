import { dbPool } from '@/lib/db';
import FormData from "form-data";
import Mailgun from "mailgun.js";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
const CAPTCHA_SECRET = process.env.JWT_SECRET || "SwingSocialLesileCaptchaKey";


import { config } from "@/config";


export const dynamic = "force-dynamic";

function sanitizeCardNumber(cardNumber: any) {
  return cardNumber.replace(/\s+/g, "");
}

function getCurrentDateTime() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function parseAuthorizeNetError(errorResponse: any) {
  // First, check transaction-specific errors if present
  if (errorResponse?.transactionResponse?.errors) {
    const error = errorResponse.transactionResponse.errors[0];
    const errorCode = String(error.errorCode);

    // Map transaction error codes
    const transactionErrorMap: { [key: string]: string } = {
      "2": "Card declined. Your bank has rejected the transaction.",
      "3": "Card declined (Referral). Please contact your bank.",
      "4": "Card declined (Pick Up Card). Please use a different card.",
      "5": "Invalid amount. Please try again with a valid amount.",
      "6": "Invalid card number. Please verify the 16-digit number.",
      "7": "Invalid expiration date. Please check the format (MM/YY).",
      "8": "Card has expired. Please use a valid, non-expired card.",
      "11": "Duplicate transaction detected. Please wait a few minutes before trying again.",
      "13": "Merchant configuration error. Please contact our support.",
      "17": "Card type not accepted. We do not accept this brand of card.",
      "27": "Transaction declined. Address verification (AVS) failed.",
      "28": "Invalid card type. Please try a different card.",
      "44": "Invalid CVV (Security Code). Please check the 3 or 4 digits on the back.",
      "45": "Security code mismatch (CVV). Please verify and try again.",
      "54": "Billing address mismatch. Please check your street address and zip code.",
      "65": "Transaction declined due to card code (CVV) mismatch.",
      "78": "Invalid security code (CVV). Please verify the number.",
      "250": "Transaction submitted from a restricted IP address.",
      "251": "The transaction was declined by the fraud detection system.",
      "315": "Invalid credit card number format. Please check the digits.",
    };

    return (
      transactionErrorMap[errorCode] ||
      error.errorText ||
      `Declined (${errorCode}): Your payment could not be processed.`
    );
  }

  // Next, check if transaction was held for review or declined but returned messages instead of errors
  if (errorResponse?.transactionResponse?.responseCode && errorResponse.transactionResponse.responseCode !== "1") {
    if (errorResponse?.transactionResponse?.messages && errorResponse.transactionResponse.messages.length > 0) {
      const msg = errorResponse.transactionResponse.messages[0];
      return `Payment Issue (${msg.code}): ${msg.description}`;
    } else {
      // Common Authorize.net response codes
      const responseCodeMap: { [key: string]: string } = {
        "2": "Transaction Declined: Your card was rejected by the bank.",
        "3": "Transaction Error: There was a technical problem with the payment.",
        "4": "Held for Review: Your transaction is pending manual approval.",
      };
      return responseCodeMap[errorResponse.transactionResponse.responseCode] || `Transaction Failed (Code: ${errorResponse.transactionResponse.responseCode})`;
    }
  }

  // Finally, check top-level API errors (only if resultCode is not Ok)
  if (errorResponse?.messages?.resultCode !== "Ok" && errorResponse?.messages?.message) {
    const errorMessage = errorResponse.messages.message[0];
    const code = errorMessage.code;
    const text = errorMessage.text;

    // Map common error codes to user-friendly messages
    const errorMap: { [key: string]: string } = {
      E00003: "Invalid API credentials. Please contact support.",
      E00027: "The transaction was declined. Please verify your card details.",
      E00013: "Invalid expiry date format. Please use MM/YY.",
      E00014: "The security code (CVV) is too short or invalid.",
      E00006: "The credit card number is invalid. Please check the digits.",
      E00007: "Invalid expiry month or year. Please verify your card.",
      E00008: "Your card has expired. Please use a different card.",
      E00009: "The CVV code is invalid. Check the 3-4 digits on your card.",
      E00040: "Card number is required.",
      E00041: "Expiry date is required.",
      E00042: "Security code (CVV) is required.",
    };

    return (
      errorMap[code] ||
      `System Error (${code}): ${text}`
    );
  }

  return "Your payment was declined. Please check your card details or try a different payment method.";
}

export async function POST(req: any) {
  try {
    const result = await dbPool.query(
      'SELECT * FROM "Configuration" WHERE "ConfigName" = $1',
      ["EmailApi"]
    );

    const mailgunKey = result.rows[0].ConfigValue;
    if (!mailgunKey) {
      throw new Error("MAILGUN_KEY environment variable is not defined");
    }

    var oneTimeResponseData;
    const onetimePrice = "$ 1";
    const {
      country,
      cardNumber,
      expiry,
      cvc,
      price,
      firstName,
      lastName,
      plan,
      length,
      isPromoCode,
      pprice,
      username,
      email,
      city,
      state,
      streetAddress,
      phone,
      zipCode,
      firstMonthFree,
      promocode,
      userid,
      captchaAnswer,
      captchaToken,
    } = await req.json();

    // Verify CAPTCHA
    if (!captchaToken || !captchaAnswer) {
      return NextResponse.json(
        { success: false, message: "CAPTCHA verification is required." },
        { status: 400 }
      );
    }

    try {
      const decoded = jwt.verify(captchaToken, CAPTCHA_SECRET) as { answer: number };
      if (Number(captchaAnswer) !== decoded.answer) {
        return NextResponse.json(
          { success: false, message: "Incorrect CAPTCHA answer. Please try again." },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "CAPTCHA expired or invalid. Please try again." },
        { status: 400 }
      );
    }


    const currentDate = getCurrentDateTime();
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: "api",
      key: mailgunKey,
    });

    // Validate required fields
    if (!cardNumber || !expiry || !cvc) {
      return NextResponse.json(
        {
          success: false,
          message: "Please fill in all required card details.",
          field: !cardNumber ? "cardNumber" : !expiry ? "expiry" : "cvc",
        },
        { status: 400 }
      );
    }

    // Validate card number format
    const cleanCardNumber = sanitizeCardNumber(cardNumber);
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid card number. Please check your card details.",
          field: "cardNumber",
        },
        { status: 400 }
      );
    }

    // Validate expiry format (MM/YY)
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid expiry date format. Please use MM/YY format.",
          field: "expiry",
        },
        { status: 400 }
      );
    }

    // Validate CVV
    if (!/^\d{3,4}$/.test(cvc)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid security code. Please enter 3 or 4 digits.",
          field: "cvc",
        },
        { status: 400 }
      );
    }

    const santiziedPrice = price.replace(/^\$/, "");
    const santiziedPromoPrice = pprice.replace(/^\$/, "");
    const santiziedOneTimePrice = onetimePrice.replace(/^\$/, "");

    const startDate = isPromoCode
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]
      : new Date().toISOString().split("T")[0];

    const subscriptionPayload = {
      ARBCreateSubscriptionRequest: {
        merchantAuthentication: {
          name: config.authorizenet.apiLoginId,
          transactionKey: config.authorizenet.transactionKey,
        },
        refId: "12345",
        subscription: {
          name: plan,
          paymentSchedule: {
            interval: {
              length: length,
              unit: "months",
            },
            startDate,
            totalOccurrences: "9999",
            trialOccurrences: "0",
          },
          amount: santiziedPrice,
          trialAmount: "0.00",
          payment: {
            creditCard: {
              cardNumber: cleanCardNumber,
              expirationDate: expiry,
              cardCode: cvc,
            },
          },
          billTo: {
            firstName: firstName,
            lastName: lastName,
            address: streetAddress,
            city: city,
            state: state,
            zip: zipCode,
          },
        },
      },
    };

    const htmlBody = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000000;">
                <h1 style="font-weight: bold; font-size: 18px; margin-bottom: 10px;">Success : Subscription Summary for ${username}</h1>                
                
                <h1 style="font-weight: bold; font-size: 18px; margin: 20px 0 10px;">User Information</h1>                
                <p style="margin: 5px 0;"><strong>First Name:</strong> ${firstName || "N/A"
      }</p>
                <p style="margin: 5px 0;"><strong>Last Name:</strong> ${lastName || "N/A"
      }</p>
                <p style="margin: 5px 0;"><strong>Phone:</strong> ${phone || "N/A"
      }</p>
                <p style="margin: 5px 0;"><strong>Username:</strong> ${username || "N/A"
      }</p>    
                <p style="margin: 5px 0;"><strong>Email:</strong> ${email || "N/A"
      }</p>   
                <p style="margin: 5px 0;"><strong>Promo Code:</strong> ${promocode || "None"
      }</p>
                <p style="margin: 5px 0;"><strong>Membership Price:</strong> ${pprice || "N/A"
      }</p>   
                <p style="margin: 5px 0;"><strong>Country:</strong> ${country}</p>
                <p style="margin: 5px 0;"><strong>State:</strong> ${state}</p>
                <p style="margin: 5px 0;"><strong>City:</strong> ${city || "N/A"
      }</p>      
                <p style="margin: 5px 0;"><strong>Street Address:</strong> ${streetAddress || "N/A"
      }</p>  
                <p style="margin: 5px 0;"><strong>Zip Code:</strong> ${zipCode}</p>
                <p style="margin: 5px 0;"><strong>Card Status:</strong> Successfully Charged</p>        
                <p style="margin: 5px 0;"><strong>Date:</strong> ${currentDate}</p>
            </div>
        `;

    const failedBody = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000000;">
                <h1 style="font-weight: bold; font-size: 18px; margin-bottom: 10px;">Sorry, we were unable to process your card request for : ${username}</h1>                
                
                <h1 style="font-weight: bold; font-size: 18px; margin: 20px 0 10px;">User Information</h1>                
                <p style="margin: 5px 0;"><strong>First Name:</strong> ${firstName || "N/A"
      }</p>
                <p style="margin: 5px 0;"><strong>Last Name:</strong> ${lastName || "N/A"
      }</p>
                <p style="margin: 5px 0;"><strong>Phone:</strong> ${phone || "N/A"
      }</p>
                <p style="margin: 5px 0;"><strong>Username:</strong> ${username || "N/A"
      }</p>    
                <p style="margin: 5px 0;"><strong>Email:</strong> ${email || "N/A"
      }</p>      
                <p style="margin: 5px 0;"><strong>Promo Code:</strong> ${promocode || "None"
      }</p>
                <p style="margin: 5px 0;"><strong>Membership Price:</strong> ${promocode || firstMonthFree ? "1" : pprice || "N/A"
      }</p>   
                <p style="margin: 5px 0;"><strong>Country:</strong> ${country}</p>
                <p style="margin: 5px 0;"><strong>City:</strong> ${city || "N/A"
      }</p>      
                <p style="margin: 5px 0;"><strong>Street Address:</strong> ${streetAddress || "N/A"
      }</p>            
                <p style="margin: 5px 0;"><strong>Zip Code:</strong> ${zipCode}</p>     
                <p style="margin: 5px 0;"><strong>Card Status:</strong> Declined</p>  
                <p style="margin: 5px 0;"><strong>Date:</strong> ${currentDate}</p>
            </div>
        `;

    const emailData: any = [
      {
        from: "info@swingsocial.co",
        to: "latuttle22@gmail.com",
        text: "",
        subject: "Subscription Summary",
        html: htmlBody,
      },
      {
        from: "info@swingsocial.co",
        to: "falconsoftmobile@gmail.com",
        text: "",
        subject: "Subscription Summary",
        html: htmlBody,
      },
      {
        from: "info@swingsocial.co",
        to: "baldhavansh2505@gmail.com",
        text: "",
        subject: "Subscription Summary",
        html: htmlBody,
      },
      {
        from: "info@swingsocial.co",
        to: email,
        text: "",
        subject: "Subscription Summary",
        html: htmlBody,
      },
    ];

    const falseData: any = [
      {
        from: "info@swingsocial.co",
        to: "latuttle22@gmail.com",
        text: "",
        subject: "Subscription Summary",
        html: failedBody,
      },
      {
        from: "info@swingsocial.co",
        to: "falconsoftmobile@gmail.com",
        text: "",
        subject: "Subscription Summary",
        html: failedBody,
      },
      {
        from: "info@swingsocial.co",
        to: "baldhavansh2505@gmail.com",
        text: "",
        subject: "Subscription Summary",
        html: failedBody,
      },
      {
        from: "info@swingsocial.co",
        to: email,
        text: "",
        subject: "Subscription Summary",
        html: failedBody,
      },
    ];

    if (isPromoCode === true) {
      const realamount =
        promocode == "" && firstMonthFree === false
          ? pprice
          : santiziedOneTimePrice;

      const oneTimePaymentPayload = {
        createTransactionRequest: {
          merchantAuthentication: {
            name: config.authorizenet.apiLoginId,
            transactionKey: config.authorizenet.transactionKey,
          },
          refId: "123456",
          transactionRequest: {
            transactionType: "authCaptureTransaction",
            amount: realamount,
            payment: {
              creditCard: {
                cardNumber: cleanCardNumber,
                expirationDate: expiry,
                cardCode: cvc,
              },
            },
            billTo: {
              firstName: firstName,
              lastName: lastName,
              address: streetAddress,
              city: city,
              state: state,
              zip: zipCode,
            },
          },
        },
      };

      const oneTimeResponse = await fetch(
        "https://api.authorize.net/xml/v1/request.api",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oneTimePaymentPayload),
        }
      );

      oneTimeResponseData = await oneTimeResponse.json();

      if (oneTimeResponseData?.transactionResponse?.responseCode === "1") {
        const subscriptionResponse = await fetch(
          "https://api.authorize.net/xml/v1/request.api",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(subscriptionPayload),
          }
        );

        const subscriptionResponseData = await subscriptionResponse.json();

        try {
          await Promise.all(
            emailData.map((email: any) =>
              mg.messages.create("swingsocial.co", email)
            )
          );

          return NextResponse.json({
            success: true,
            message:
              "Payment processed successfully! Your membership has been upgraded.",
            oneTimePaymentResponse: oneTimeResponseData,
            subscriptionResponse: subscriptionResponseData,
            respondCode: oneTimeResponseData?.transactionResponse?.responseCode,
          });
        } catch (error) {
          throw new Error("There are some errors while processing the email.");
        }
      } else {
        await Promise.all(
          falseData.map((email: any) =>
            mg.messages.create("swingsocial.co", email)
          )
        );

        const errorMessage = parseAuthorizeNetError(oneTimeResponseData);
        return NextResponse.json({
          success: false,
          message: errorMessage,
          oneTimePaymentResponse: oneTimeResponseData,
          subscriptionResponse: null,
          respondCode: oneTimeResponseData?.transactionResponse?.responseCode,
        });
      }
    } else {
      const oneTimePaymentPayload = {
        createTransactionRequest: {
          merchantAuthentication: {
            name: config.authorizenet.apiLoginId,
            transactionKey: config.authorizenet.transactionKey,
          },
          refId: "123456",
          transactionRequest: {
            transactionType: "authCaptureTransaction",
            amount:
              firstMonthFree == true
                ? santiziedOneTimePrice
                : santiziedPromoPrice,
            payment: {
              creditCard: {
                cardNumber: cleanCardNumber,
                expirationDate: expiry,
                cardCode: cvc,
              },
            },
            billTo: {
              firstName: firstName,
              lastName: lastName,
              address: streetAddress,
              city: city,
              state: state,
              zip: zipCode,
            },
          },
        },
      };

      const oneTimeResponse = await fetch(
        "https://api.authorize.net/xml/v1/request.api",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oneTimePaymentPayload),
        }
      );

      oneTimeResponseData = await oneTimeResponse.json();

      if (oneTimeResponseData?.transactionResponse?.responseCode === "1") {
        const subscriptionResponse = await fetch(
          "https://api.authorize.net/xml/v1/request.api",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(subscriptionPayload),
          }
        );

        const subscriptionResponseData = await subscriptionResponse.json();

        await Promise.all(
          emailData.map((email: any) =>
            mg.messages.create("swingsocial.co", email)
          )
        );

        return NextResponse.json({
          success: true,
          message:
            "Payment processed successfully! Your membership has been upgraded.",
          oneTimePaymentResponse: null,
          subscriptionResponse: subscriptionResponseData,
          respondCode: oneTimeResponseData?.transactionResponse?.responseCode,
        });
      } else {
        await Promise.all(
          falseData.map((email: any) =>
            mg.messages.create("swingsocial.co", email)
          )
        );

        const errorMessage = parseAuthorizeNetError(oneTimeResponseData);
        return NextResponse.json({
          success: false,
          message: errorMessage,
          oneTimePaymentResponse: null,
          subscriptionResponse: null,
          respondCode: oneTimeResponseData?.transactionResponse?.responseCode,
        });
      }
    }
  } catch (error: any) {
    console.error("Error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "We're experiencing technical difficulties. Please try again in a moment.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}




