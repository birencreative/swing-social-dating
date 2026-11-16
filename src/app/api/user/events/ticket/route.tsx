import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const { ticketID, ticketQuantity } = await req.json();

    const updateQtyQuery = `SELECT * FROM public.event_ticket_updateqty($1, $2)`;

    const client = await dbPool.connect();

    try {
      const updateResult = await client.query(updateQtyQuery, [
        ticketID,
        ticketQuantity,
      ]);

      return NextResponse.json(
        { success: true, data: updateResult.rows },
        { status: 200 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database query failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
