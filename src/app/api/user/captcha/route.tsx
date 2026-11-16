import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const CAPTCHA_SECRET = process.env.JWT_SECRET || "SwingSocialLesileCaptchaKey";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Generate two random numbers between 1 and 20
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const sum = num1 + num2;

    // Sign the answer with a 5-minute expiration
    const token = jwt.sign({ answer: sum }, CAPTCHA_SECRET, { expiresIn: "5m" });

    return NextResponse.json({
      success: true,
      num1,
      num2,
      captchaToken: token,
    });
  } catch (error: any) {
    console.error("Captcha generation error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate CAPTCHA" },
      { status: 500 }
    );
  }
}
