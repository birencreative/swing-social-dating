import { NextResponse } from 'next/server';
import { getCachedRewrittenPartnerEvents } from '@/services/eventScraper';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const events = await getCachedRewrittenPartnerEvents();
        
        return NextResponse.json({
            events,
            total: events.length,
            success: true,
        });
    } catch (error) {
        console.error('Scraping error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to scrape events', success: false },
            { status: 500 }
        );
    }
}