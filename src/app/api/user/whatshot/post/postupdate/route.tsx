import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';


export async function POST(req: any) {
    try {
        const { postId, caption, photoLink } = await req.json();

        const result = await dbPool.query(
            'SELECT * FROM update_post($1, $2, $3)',
            [postId, photoLink, caption]
        );

        console.log('Database Result', result);

        return NextResponse.json({
            message: 'Post updated successfully',
        });

    } catch (error: any) {
        console.error('Error in POST handler:', error);

        return NextResponse.json(
            {
                message: 'Post update failed',
                error: error.message || 'Unknown error',
            },
            { status: 500 }
        );
    }
}