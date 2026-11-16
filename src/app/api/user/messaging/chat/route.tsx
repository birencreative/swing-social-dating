import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// PostgreSQL dbPool connection setup

export async function POST(req: any) {
    console.log("Request received");

    // Parse the request body
    const {
        ProfileIdfrom,
        ProfileIDto,
    } = await req.json();

    try {
      
        // Insert the conversation
        const result = await dbPool.query(
            'SELECT * From get_chat_main($1,$2)',
            [ProfileIdfrom,ProfileIDto]
        );

        // Fetch Viewed status for the returned messages
        const messageIds = result.rows.map((r: any) => r.ConversationId).filter(Boolean);
        const viewedMap = new Map();
        if (messageIds.length > 0) {
            const viewedResult = await dbPool.query(
                'SELECT "Id", "Viewed" FROM "ChatMessages" WHERE "Id" = ANY($1::uuid[])',
                [messageIds]
            );
            viewedResult.rows.forEach((row: any) => {
                viewedMap.set(String(row.Id), row.Viewed);
            });
        }

        const enrichedData = result.rows.map((row: any) => ({
            ...row,
            Viewed: viewedMap.has(String(row.ConversationId)) ? viewedMap.get(String(row.ConversationId)) : 0
        }));

        // Return success response
        return NextResponse.json({
            message: 'Chat conversation inserted successfully',
            data: enrichedData, // Include enriched rows
        });
    } catch (error: any) {
        console.error("Error:", error);

        // Return failure response
        return NextResponse.json({
            message: 'Chat conversation insertion failed',
            error: error.message, // Include error details for debugging
        }, { status: 400 });
    }
}
