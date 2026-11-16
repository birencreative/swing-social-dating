import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

// PostgreSQL dbPool connection setup

export async function POST(req: any) {
    const { pid, interests } = await req.json();
    console.log(pid)
    console.log(interests)
    let interest = "";
    if (interests.male === true) {
        interest = "male";
    }
    else if (interests.female === true) {
        interest = "female";
    }
    else if (interests.couple === true) {
        interest = "couple";
    }
    try {
        const result = await dbPool.query(
            'SELECT * FROM public.web_update_swingstyle($1, $2)',
            [pid, interest]
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