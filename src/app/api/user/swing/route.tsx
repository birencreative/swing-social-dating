import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

// PostgreSQL dbPool connection setup

export async function POST(req: any) {
    const { pid, swingstyle } = await req.json();

    const selectedInterests = Object.entries(swingstyle)
        .filter(([key, value]) => value === true) // Filter only true values
        .map(([key, _]) => key) // Get the keys of true values
        .join(","); // Join them into a single string

    console.log("Selected Interests: ", selectedInterests);

    // If no interests are selected, return an error response
    if (!selectedInterests) {
        return NextResponse.json(
            { message: "No valid interests were provided." },
            { status: 400 } // Bad Request
        );
    }

    console.log(selectedInterests);

    try {
        const result = await dbPool.query(
            'SELECT * FROM public.web_update_swingstyle($1, $2)',
            [pid, selectedInterests]
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