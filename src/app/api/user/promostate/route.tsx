import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

// PostgreSQL dbPool connection setup

export async function POST(req: any) {
    const { state } = await req.json();
    console.log(state)
    try {
        if (state != null) {
            const result = await dbPool.query(
                'SELECT * FROM public.admin_state_lookup($1)',
                [state]
            );

            console.log(result.rows[0].FreeMonth, result.rows);

            if (result.rows[0].FreeMonth == 0) {
                return NextResponse.json({
                    message: 'Profile created successfully',
                    result: 0
                });
            } else {
                return NextResponse.json({
                    message: 'Fetch the data successfully!',
                    result: result.rows[0].FreeMonth
                });
            }
        } else {
            console.log("------------------------")
            return NextResponse.json({
                message: 'Fetch the data successfully!',
                result: 0
            });
        }
    }
    catch (error: any) {
        return NextResponse.json({
            message: 'User Name Update failed',
        }, { status: 400 });
    }
}