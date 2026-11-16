import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


export async function POST(req: Request) {
    try {
        const { id } = await req.json();

        const getQuery = `SELECT * FROM market_get_oneproduct($1)`;

        const result = await dbPool.query(getQuery, [id]);

        return NextResponse.json(
            { message: "Get the result successfully!", products: result?.rows || [] }
        );
    } catch (error: any) {
        console.error("Error fetching single marketplace product:", error);
        return NextResponse.json({ error: error.message || 'Internal server error', products: [] }, { status: 500 });
    }
}