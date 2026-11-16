import { dbPool } from '@/lib/db';
import FormData from "form-data";
import Mailgun from "mailgun.js";

import { NextResponse } from "next/server";


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

    const { username, email, code } = await req.json();
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: "api",
      key: mailgunKey,
    });

    const emailData: any = {
      from: "Swing Social <info@swingsocial.co>",
      to: email,
      subject: `Verify Your Account: ${code} is your Swing Social code`,
      text: `Hi ${username},\n\nWelcome to Swing Social! Your email verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe Swing Social Team`,
      html: `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Email Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0412; font-family: Arial, sans-serif; color: #ffffff;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0a0412; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #14071f; border-radius: 16px; border: 1px solid #251b33;">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 10px 40px;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #FF2D95; text-transform: uppercase; letter-spacing: 1px;">SWING SOCIAL</h1>
                            <p style="margin: 5px 0 0 0; font-size: 12px; color: #665577; text-transform: uppercase; letter-spacing: 2px;">Your Private Social Network</p>
                        </td>
                    </tr>
                    <!-- Main Body -->
                    <tr>
                        <td align="center" style="padding: 30px 40px 40px 40px;">
                            <h2 style="margin: 0; font-size: 22px; font-weight: bold; color: #ffffff;">Verify Your Email Address</h2>
                            <p style="margin: 20px 0 30px 0; font-size: 15px; color: #a195b3; line-height: 1.6;">Hi ${username},<br/>Thanks for joining Swing Social! Please use the verification code below to confirm your email and complete your registration.</p>
                            
                            <!-- Secure Code Box -->
                            <table border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" style="background-color: #1f0b29; border: 2px solid #FF2D95; border-radius: 12px; padding: 25px 40px;">
                                        <span style="font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #FF2D95; font-family: monospace;">${code}</span>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 0 0; font-size: 13px; color: #5c526b;">This code is valid for 10 minutes and can only be used once.</p>
                        </td>
                    </tr>
                    <!-- Footer Info -->
                    <tr>
                        <td align="center" style="padding: 0 40px 40px 40px;">
                            <div style="height: 1px; background-color: #251b33; margin-bottom: 25px;"></div>
                            <p style="margin: 0; font-size: 11px; color: #4d435c; line-height: 1.5;">You received this email because a request was made to verify this email address for a Swing Social account. If you didn't make this request, you can safely ignore this email.</p>
                        </td>
                    </tr>
                </table>
                <!-- Legal Footer (Required for Spam Filters) -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin-top: 25px;">
                    <tr>
                        <td align="center" style="padding: 0 20px;">
                            <p style="margin: 0; font-size: 11px; color: #4d435c;">&copy; 2026 Swing Social</p>
                            <p style="margin: 10px 0 0 0; font-size: 11px;">
                                <a href="https://swingsocial.co/privacy" style="color: #FF2D95; text-decoration: none;">Privacy Policy</a> &nbsp;&nbsp;|&nbsp;&nbsp; 
                                <a href="https://swingsocial.co/terms" style="color: #FF2D95; text-decoration: none;">Terms of Service</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`,
    };

    const data = await mg.messages.create("swingsocial.co", emailData);
    if (!data || !data.id) {
      throw new Error("Failed to send email");
    }
    return NextResponse.json({
      message: "Email is sent successfully",
    });
  } catch (error: any) {
    console.error("Error sending email:", error);

    return NextResponse.json(
      {
        message: "Error sending email",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
