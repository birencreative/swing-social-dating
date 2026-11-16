/**
 * ! We haven't used this file in our template. We've used the server actions in the
 * ! `src/app/server/actions.ts` file to fetch the static data from the fake-db.
 * ! This file has been created to help you understand how you can create your own API routes.
 * ! Only consider making API routes if you're planing to share your project data with other applications.
 * ! else you can use the server actions or third-party APIs to fetch the data from your database.
 */
import { dbPool } from '@/lib/db';


// Next Imports
import { responsiveFontSizes } from '@mui/material';
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';


export async function POST(req: any) {
    const { id, targetId } = await req.json();

    try {
        const result = await dbPool.query(

            'select * from public.insert_friend($1,$2)',
            [id, targetId]
        );


        return NextResponse.json({
            message: 'Friend Added Successfully',
            data:result?.rows
        });
    }
    catch (error: any) {
        return NextResponse.json({
            message: 'Relationship Category Update failed',
        }, { status: 400 });
    }
}