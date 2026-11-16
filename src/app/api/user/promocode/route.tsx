import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

// PostgreSQL dbPool connection setup

export async function POST(req: any) {
    const { pid, promocode } = await req.json();
    console.log(pid)
    try {
        const result = await dbPool.query(
            'SELECT * FROM public.web_update_promocode($1, $2)',
            [pid, promocode]
        );

        console.log(result)

        return NextResponse.json({
            message: 'Profile created successfully',
        });
    }
    catch (error: any) {
        return NextResponse.json({
            message: 'User Name Update failed',
        }, { status: 400 });
    }
}