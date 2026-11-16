import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

// PostgreSQL dbPool connection setup

export async function GET(req: any) {
    

    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('query');
        const result = await dbPool.query(
            'SELECT * FROM public.market_search_products($1)',
            [search]
        );

        return NextResponse.json({
            message: 'Search completed successfully',
            products: result?.rows || []
        });
    }
    catch (error: any) {
        console.error("Error searching marketplace products:", error);
        return NextResponse.json({
            message: 'Search failed',
            error: error.message || 'Internal server error',
            products: []
        }, { status: 400 });
    }
}