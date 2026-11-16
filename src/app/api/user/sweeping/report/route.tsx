import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

// PostgreSQL dbPool connection setup

export async function POST(req: any) {
    const { pid, targetid } = await req.json();
    try {
        const result = await dbPool.query(
            
            'select * from public.block_unblock_profile($1,$2)',
            [pid, targetid]
        );

        console.log(result)

        return NextResponse.json({
            message: 'User reported successfully',
        });
    }
    catch (error: any) {
        console.log(error);
        return NextResponse.json({
            message: 'User report failed',
        }, { status: 400 });
    }
}