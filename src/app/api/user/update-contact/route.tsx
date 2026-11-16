import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  try {
    const { ProfileId, type, value } = await req.json();

    if (!ProfileId || !type || !value) {
      return NextResponse.json(
        { message: "Missing required fields: ProfileId, type, or value" },
        { status: 400 }
      );
    }

    let query = "";
    if (type === "email") {
      query = "SELECT public.update_user_email_by_profile(($1)::uuid, ($2)::text)";
    } else if (type === "phone") {
      query = "SELECT public.update_user_phone_by_profile(($1)::uuid, ($2)::text)";
    } else {
      return NextResponse.json(
        { message: "Invalid type. Must be 'email' or 'phone'." },
        { status: 400 }
      );
    }

    await dbPool.query(query, [ProfileId, value]);

    return NextResponse.json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`,
    });
  } catch (error: any) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      {
        message: "Error updating contact information",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
