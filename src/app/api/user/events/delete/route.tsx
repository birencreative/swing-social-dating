import { dbPool } from '@/lib/db';
import { responsiveFontSizes } from '@mui/material';
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';


export async function POST(req: Request) {
    try {
        const { eventId } = await req.json();
        console.log(eventId);

        if (!eventId) {
            return NextResponse.json(
                { error: 'Event ID is required for deletion.' },
                { status: 400 }
            );
        }

        console.log(`Deleting event with ID: ${eventId}`);

        // Call a hypothetical delete function for events (replace with actual function if available)
        const deleteQuery = `SELECT * FROM public.event_delete($1)`; // Replace with correct function
        const result = await dbPool.query(deleteQuery, [eventId]);

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: `No event found with ID ${eventId}` },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: `Event with ID ${eventId} deleted successfully.` },
            { status: 200 }
        );
    } catch (error) {
        console.error('Failed to delete event:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}