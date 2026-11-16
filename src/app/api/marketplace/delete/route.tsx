import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// PostgreSQL dbPool connection setup

export async function POST(req: any) {
	const { productId } = await req.json();
	console.log("===========>");
	console.log(productId);
	try {
		const result = await dbPool.query(
			"select * from  public.market_delete_product($1)",
			[productId]
		);

		if (result.rows[0]) {
			return NextResponse.json({
				message: "Your product is deleted successfully!",
				status: 200,
			});
		} else {
			throw new Error("Image uploading is failed");
		}
	} catch (error: any) {
		return NextResponse.json(
			{
				message: "Image uploading is failed",
			},
			{ status: 400 }
		);
	}
}
