import { dbPool } from '@/lib/db';
// import { NextResponse } from "next/server";
// import FormData from "form-data";
// import Mailgun from "mailgun.js";
// 
// 
// type ErrorMeta = {
//   api?: string;
//   phone?: string;
//   countryCode?: string;
//   mobileNumber?: string;
//   verificationId?: string;
//   endpoint?: string;
// };

// async function sendErrorEmail(errorMessage: string, meta?: ErrorMeta) {
//   try {
//     const result = await dbPool.query(
//       'SELECT * FROM "Configuration" WHERE "ConfigName" = $1 LIMIT 1',
//       ["EmailApi"],
//     );

//     const mailgunKey = result?.rows?.[0]?.ConfigValue;

//     if (!mailgunKey) {
//       console.error("Mailgun key not found in DB");
//       return;
//     }

//     const mailgun = new Mailgun(FormData);

//     const mg = mailgun.client({
//       username: "api",
//       key: mailgunKey,
//     });

//     const lowerError = (errorMessage || "").toLowerCase();

//     let subject = "🚨 OTP Service Error Detected";

//     if (lowerError.includes("pricing not found")) {
//       subject = "🌍 Pricing Not Enabled (International OTP Failed)";
//     } else if (lowerError.includes("fund") || lowerError.includes("balance")) {
//       subject = "💰 SMS Balance / Billing Issue";
//     } else if (meta?.api === "VERIFY_OTP") {
//       subject = "🔐 OTP Verification Failed";
//     } else if (meta?.api === "SEND_OTP") {
//       subject = "📩 OTP Send Failed";
//     }

//     const recipients = ["baldhavansh2505@gmail.com"];

//     const formattedText = `
// 🚨 MESSAGECENTRAL OTP

// 🌍 Country Code: ${meta?.countryCode ?? "N/A"}
// 📞 Phone: ${meta?.phone ?? meta?.mobileNumber ?? "N/A"}

// ---------------------------------------
// 🧾 Error Message:
// ${errorMessage || "Unknown error"}
// ---------------------------------------

// 🕒 Time: ${new Date().toISOString()}
// 🖥 Environment: ${process.env.NODE_ENV ?? "development"}

// 🔧 MessageCentral Console Link Here:
// https://console.messagecentral.com/

// 🔑 Credentials:
// Email: clark@eldoramountainsoftware.ai
// Password: Bmw850csi#
// `.trim();

//     await mg.messages.create("swingsocial.co", {
//       from: "info@swingsocial.co",
//       to: recipients,
//       subject,
//       text: formattedText,
//     });

//     console.log("✅ Error email sent with meta successfully");
//   } catch (err) {
//     console.error("❌ Failed to send error email:", err);
//   }
// }

// export async function POST(req: Request) {
//   let phone = "";
//   let countryCode = "";

//   try {
//     const body = await req.json();
//     phone = body?.phone;
//     countryCode = body?.countryCode;

//     if (!phone || !countryCode) {
//       return NextResponse.json(
//         { success: false, message: "Phone and countryCode are required" },
//         { status: 400 },
//       );
//     }

//     const endpoint = "SEND_OTP";

//     const url = `https://cpaas.messagecentral.com/verification/v3/send?countryCode=${countryCode}&customerId=C-F24E05DFFC23458&flowType=SMS&mobileNumber=${phone}`;

//     const response = await fetch(url, {
//       method: "POST",
//       headers: {
//         authToken:
//           "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUYyNEUwNURGRkMyMzQ1OCIsImlhdCI6MTc3NDU0NzE1NiwiZXhwIjoxOTMyMjI3MTU2fQ.5OY4ynSfxuHiWo6ctAuAPGAN0RnjwRlE6wasZIGOkIZBHQdXkOcdCAdz90fSfcWf4LGtlaAKcoHWqjAqS23yGw",
//         "Content-Type": "application/json",
//       },
//     });

//     const data = await response.json().catch(() => ({}));

//     if (!response.ok || data?.error || data?.status === "FAILED") {
//       const errorMessage =
//         data?.message ||
//         data?.error ||
//         data?.reason ||
//         JSON.stringify(data) ||
//         "Unknown MessageCentral SEND OTP error";

//       throw new Error(
//         `MessageCentral SEND OTP Error
// Status: ${response.status}
// Response: ${JSON.stringify(data)}`,
//       );
//     }

//     return NextResponse.json(
//       {
//         success: true,
//         data,
//         message: data?.message || "OTP sent successfully",
//       },
//       { status: 200 },
//     );
//   } catch (error: any) {
//     console.error("❌ Error sending OTP:", error);

//     await sendErrorEmail(error?.message || "Unknown SEND OTP error", {
//       api: "SEND_OTP",
//       phone,
//       countryCode,
//       endpoint: "/api/otp (POST)",
//     });

//     return NextResponse.json(
//       {
//         success: false,
//         message: error?.message || "Failed to send OTP",
//       },
//       { status: 400 },
//     );
//   }
// }

// export async function GET(req: Request) {
//   let countryCode = "";
//   let mobileNumber = "";
//   let verificationId = "";
//   let code = "";

//   try {
//     const { searchParams } = new URL(req.url);

//     countryCode = searchParams.get("countryCode") || "";
//     mobileNumber = searchParams.get("mobileNumber") || "";
//     verificationId = searchParams.get("verificationId") || "";
//     code = searchParams.get("code") || "";

//     if (!countryCode || !mobileNumber || !verificationId || !code) {
//       return NextResponse.json(
//         { message: "Missing required query params" },
//         { status: 400 },
//       );
//     }

//     const url = `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=${countryCode}&mobileNumber=${mobileNumber}&verificationId=${verificationId}&customerId=C-F24E05DFFC23458&code=${code}`;

//     const response = await fetch(url, {
//       method: "GET",
//       headers: {
//         authToken:
//           "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUYyNEUwNURGRkMyMzQ1OCIsImlhdCI6MTc3NDU0NzE1NiwiZXhwIjoxOTMyMjI3MTU2fQ.5OY4ynSfxuHiWo6ctAuAPGAN0RnjwRlE6wasZIGOkIZBHQdXkOcdCAdz90fSfcWf4LGtlaAKcoHWqjAqS23yGw",
//       },
//     });

//     const data = await response.json().catch(() => ({}));

//     if (!response.ok || data?.error || data?.status === "FAILED") {
//       throw new Error(
//         `MessageCentral VERIFY OTP Error
// Status: ${response.status}
// Response: ${JSON.stringify(data)}`,
//       );
//     }

//     return NextResponse.json(data, { status: 200 });
//   } catch (error: any) {
//     console.error("❌ Error verifying OTP:", error);

//     await sendErrorEmail(error?.message || "Unknown VERIFY OTP error", {
//       api: "VERIFY_OTP",
//       mobileNumber,
//       countryCode,
//       verificationId,
//       endpoint: "/api/otp (GET)",
//     });

//     return NextResponse.json(
//       { message: "Failed to verify OTP" },
//       { status: 400 },
//     );
//   }
// }


import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { phone, countryCode } = await req.json();

    const url = `https://cpaas.messagecentral.com/verification/v3/send?countryCode=${countryCode}&customerId=C-F24E05DFFC23458&flowType=SMS&mobileNumber=${phone}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        authToken:
          "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUYyNEUwNURGRkMyMzQ1OCIsImlhdCI6MTc3NDU0NzE1NiwiZXhwIjoxOTMyMjI3MTU2fQ.5OY4ynSfxuHiWo6ctAuAPGAN0RnjwRlE6wasZIGOkIZBHQdXkOcdCAdz90fSfcWf4LGtlaAKcoHWqjAqS23yGw",
      },
    });

    const data = await response.json();

    if (!response.ok || data?.status === "FAILED" || data?.error) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || data?.error || "Failed to send OTP",
          details: data
        },
        { status: response.status === 200 ? 400 : response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to send OTP" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const countryCode = searchParams.get("countryCode");
    const mobileNumber = searchParams.get("mobileNumber");
    const verificationId = searchParams.get("verificationId");
    const code = searchParams.get("code");

    if (!countryCode || !mobileNumber || !verificationId || !code) {
      return NextResponse.json(
        { message: "Missing required query params" },
        { status: 400 },
      );
    }

    const url = `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=${countryCode}&mobileNumber=${mobileNumber}&verificationId=${verificationId}&customerId=C-F24E05DFFC23458&code=${code}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        authToken:
          "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUYyNEUwNURGRkMyMzQ1OCIsImlhdCI6MTc3NDU0NzE1NiwiZXhwIjoxOTMyMjI3MTU2fQ.5OY4ynSfxuHiWo6ctAuAPGAN0RnjwRlE6wasZIGOkIZBHQdXkOcdCAdz90fSfcWf4LGtlaAKcoHWqjAqS23yGw",
      },
    });

    const data = await response.json();

    if (!response.ok || data?.status === "FAILED" || data?.error) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || data?.error || "Failed to verify OTP",
          details: data
        },
        { status: response.status === 200 ? 400 : response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to verify OTP" },
      { status: 500 },
    );
  }
}
