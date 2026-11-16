import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

// PostgreSQL dbPool connection setup

export async function POST(req: any) {
    const { profileId, imageId } = await req.json();

    try {
        const result = await dbPool.query(
            'select * from  public.images_delete_public_image($1)',
            [imageId]
        );

        if (result.rows[0]) {
            return NextResponse.json({
                message: 'Your public image is deleted successfully!',
                status: 200
            });
        } else {
            throw new Error("Image deleting is failed");
        }
    }
    catch (error: any) {
        return NextResponse.json({
            message: 'Image deleting is failed',
        }, { status: 400 });
    }
}