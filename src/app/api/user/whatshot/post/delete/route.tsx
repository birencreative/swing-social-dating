import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';


export async function POST(req: any) {
    try {
        const { postId } = await req.json();

        const result = await dbPool.query(
            'SELECT * FROM delete_comments_post_fn($1)',
            [postId]
        );

        console.log('Database Result', result);

        return NextResponse.json({
            message: 'Post deleted successfully',
        });

    } catch (error: any) {
        console.error('Error in POST handler:', error);

        return NextResponse.json(
            {
                message: 'Post delete failed',
                error: error.message || 'Unknown error',
            },
            { status: 500 }
        );
    }
}