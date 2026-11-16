import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

// PostgreSQL dbPool connection setup

export async function POST(req: any) {
    const { profileId, imageId } = await req.json();
    console.log("===========>");
    console.log(imageId);
    try {
        const result = await dbPool.query(
            'select * from  public.images_delete_private_image($1)',
            [imageId]
        );

        if (result.rows[0]) {
            return NextResponse.json({
                message: 'Your private image is deleted successfully!',
                status: 200
            });
        } else {
            throw new Error("Image uploading is failed");
        }
    }
    catch (error: any) {
        return NextResponse.json({
            message: 'Image uploading is failed',
        }, { status: 400 });
    }
}