import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

// PostgreSQL dbPool connection setup

export async function POST(req: any) {
    const { profileId, imageURL } = await req.json();

    try {
        const result = await dbPool.query(
            'SELECT * FROM  public.images_insert_private_image($1,$2)',
            [profileId, imageURL]
        );

        if (result.rows[0]) {
            return NextResponse.json({
                message: 'Your private image is uploaded successfully!',
                status: 200
            });
        } else {
            throw new Error("Image uploading is failed");
        }

    }
    catch (error: any) {
        return NextResponse.json({
            message: 'Image uploading is failed',
            status: 400
        });
    }
}