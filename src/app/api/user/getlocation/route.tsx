import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

// PostgreSQL dbPool connection setup

export async function POST(req: any) {
    try {
        // Parse the JSON body to get profileId, locationName, latitude, and longitude
        const { id } = await req.json();

        // Execute the database query with the provided parameters
        const result = await dbPool.query(
            'SELECT * FROM admin_getoneprofile($1)',
            [id]
        );

        return NextResponse.json(
            { message: "Get the result successfully!", product: result.rows[0] }
        );
    } catch (error: any) {
        console.error('Error in POST handler:', error);

        return NextResponse.json(
            {
                message: 'Location update failed',
                error: error.message || 'Unknown error',
            },
            { status: 500 }
        );
    }
}
