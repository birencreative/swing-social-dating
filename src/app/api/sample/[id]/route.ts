import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


export async function GET(req: Request, context: any) {
  try {
    // Next.js 15+ passes params as a Promise, so we must await it!
    const params = await context.params;
    const eventId = parseInt(params?.id, 10);
    if (isNaN(eventId)) {
       return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    const result = await dbPool.query('SELECT * FROM public."Partner_Events" WHERE id = $1', [eventId]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }
    return NextResponse.json({ event: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
