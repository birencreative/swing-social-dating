import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";


export async function GET(req: Request) {
  let client: any = null;

  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: "Missing profileId parameter." },
        { status: 400 }
      );
    }

    client = await dbPool.connect();

    const result = await client.query(
      `
      SELECT 
        "Id", 
        "Amount", 
        "PayoutMethod", 
        "TransactionId", 
        "Status", 
        "CreatedAt" 
      FROM "AffiliatePayoutHistory"
      WHERE "ProfileId" = $1
      ORDER BY "CreatedAt" DESC
      `,
      [profileId]
    );

    return NextResponse.json({
      success: true,
      history: result.rows,
    });
  } catch (error: any) {
    console.error("Payout History API error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error?.message },
      { status: 500 }
    );
  } finally {
    if (client) {
      try {
        client.release();
      } catch (e) {
        console.error("Failed to release client:", e);
      }
    }
  }
}
