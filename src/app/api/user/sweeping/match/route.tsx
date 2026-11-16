import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

// PostgreSQL dbPool connection setup

export async function POST(req: any) {
    const { profileid, targetid } = await req.json();
    console.log("pid", profileid, "targetid", targetid)
    try {
        const result = await dbPool.query(
            'SELECT * FROM public.get_like_match($1, $2)',
            [profileid, targetid]
        );

        console.log(result.rows)

        return NextResponse.json({
            message: 'Like match result',
            isMatch:result?.rows[0]?.Match
        });
    }
    catch (error: any) {
        return NextResponse.json({
            message: 'Like match Update failed',
        }, { status: 400 });
    }
}