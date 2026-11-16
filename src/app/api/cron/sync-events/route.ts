import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { config } from '@/config';
import { parsePartnerEventDate } from '@/utils/distance';
import { isValidEventFlyer } from '@/utils/eventImageUtils';

export const dynamic = 'force-dynamic';

// Use env vars — never hardcode credentials

const BASE_URL = 'https://swingsocialevents.co';

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
   const controller = new AbortController();
   const timer = setTimeout(() => controller.abort(), timeoutMs);
   try {
      return await fetch(url, {
         headers: { 'User-Agent': 'Mozilla/5.0' },
         signal: controller.signal,
      });
   } finally {
      clearTimeout(timer);
   }
}

// extractJsonFromText removed (Gemini AI rewriter removed)

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

function convertRelativeUrls(htmlStr: string, baseUrl: string): string {
   if (!htmlStr) return htmlStr;
   const $ = cheerio.load(htmlStr, null, false);
   $('img').each((_, img) => {
      const src = $(img).attr('src');
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
         $(img).attr('src', src.startsWith('/') ? `${baseUrl}${src}` : `${baseUrl}/${src}`);
      }
   });
   $('a').each((_, a) => {
      const href = $(a).attr('href');
      if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('javascript:')) {
         $(a).attr('href', href.startsWith('/') ? `${baseUrl}${href}` : `${baseUrl}/${href}`);
      }
   });
   return $.html();
}

function generateSlug(title: string, sourceId?: string, maxLength = 70): string {
   let slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

   if (sourceId) {
      slug = `${slug}-${sourceId}`;
   }

   if (slug.length > maxLength) {
      const parts = slug.split('-');
      const idPart = sourceId ? parts[parts.length - 1] : '';
      const titlePart = parts.slice(0, sourceId ? -1 : undefined).join('-');
      const truncatedTitle = titlePart.slice(0, maxLength - (idPart ? idPart.length + 1 : 0));
      slug = idPart ? `${truncatedTitle}-${idPart}` : truncatedTitle;
   }

   return slug;
}

export async function GET(req: Request) {
   const client = await dbPool.connect();

   try {
      // 1. Ensure table exists
      await client.query(`
      CREATE TABLE IF NOT EXISTS public."Partner_Events" (
        id               SERIAL PRIMARY KEY,
        source_id        VARCHAR(255) UNIQUE NOT NULL,
        slug_name        VARCHAR(255),
        original_title   TEXT,
        original_description TEXT,
        seo_title        TEXT,
        seo_description  TEXT,
        event_date       VARCHAR(255),
        event_time       VARCHAR(255),
        producer         VARCHAR(255),
        location_name    VARCHAR(255),
        detail_url       TEXT,
        popup_data       JSONB,
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE public."Partner_Events" ADD COLUMN IF NOT EXISTS event_time VARCHAR(255);
      ALTER TABLE public."Partner_Events" ADD COLUMN IF NOT EXISTS slug_name VARCHAR(255);
      CREATE INDEX IF NOT EXISTS idx_partner_events_slug_name ON public."Partner_Events"(slug_name);
    `);

      // Removed TRUNCATE TABLE command

      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const year = today.getFullYear();
      const currentDate = `${month}/${day}/${year}`;

      let currentPage = 1;
      let totalProcessed = 0;
      let totalFound = 0;
      let isEOF = false;

      while (!isEOF) {
         const url =
            `${BASE_URL}/events/partner_events` +
            `?search_criteria[start_date]=${currentDate}` +
            `&search_criteria[days_from]=unlimited` +
            `&search_criteria[less_more]=more+than` +
            `&search_criteria[distance_from]=0` +
            `&search_criteria[distance_uom]=miles` +
            `&search_criteria[location_name]=` +
            `&page=${currentPage}`;

         console.log(`[Sync] Fetching Page ${currentPage}...`);

         const res = await fetchWithTimeout(url);
         const html = await res.text();
         const $ = cheerio.load(html);

         const eventsToProcess: Array<{
            source_id: string;
            title: string;
            url: string;
            date: string;
            time: string;
            location: string;
            producer: string;
         }> = [];

         $('#event_list tr').each((_, el) => {
            const cells = $(el).find('td');
            if (cells.length < 6) return;

            const nameCell = $(cells[1]);
            if (!nameCell.hasClass('name')) return;

            const linkEl = nameCell.find('a').first();
            const href = linkEl.attr('href')?.trim();
            const title = linkEl.text().trim();

            if (!href || !href.includes('/events/')) return;

            const idString = href.split('/events/')[1]?.split('?')[0];
            if (!idString) return;

            // Date & time extraction
            const dateCell = $(cells[2]);
            const whenDate = dateCell.contents().first().text().trim();
            const whenTime = dateCell.find('br').length
               ? dateCell.html()?.split('<br>')[1]?.trim() || ''
               : '';
            const cleanTime = whenTime.replace(/<[^>]*>/g, '').trim();

            // Location
            const location = $(cells[3]).text().trim();

            // Producer / Host
            const hostCell = $(cells[4]);
            const hostNameSpan = hostCell.find('span.notranslate').first();
            const whoName =
               hostNameSpan.text().trim() ||
               hostCell.find('a').first().text().trim() ||
               hostCell.text().trim();

            eventsToProcess.push({
               source_id: idString,
               title,
               url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
               date: whenDate,
               time: cleanTime,
               location,
               producer: whoName,
            });
         });

         if (eventsToProcess.length === 0) {
            console.log(`[Sync] Zero events found on page ${currentPage}. End of pagination.`);
            isEOF = true;
            break;
         }

         console.log(`[Sync] Found ${eventsToProcess.length} events on page ${currentPage}.`);
         totalFound += eventsToProcess.length;

         for (const event of eventsToProcess) {
            // Check duplications
            const { rowCount } = await client.query(
               'SELECT id FROM public."Partner_Events" WHERE source_id = $1',
               [event.source_id]
            );
            if (rowCount && rowCount > 0) {
               console.log(`[Sync] Skipping previously imported event: ${event.source_id}`);
               continue;
            }

            console.log(`[Sync] Processing new event ${event.source_id}: ${event.title}`);

            let originalDescription = event.title;
            let popupData: Record<string, unknown> = { originalUrl: event.url };

            try {
               const detailRes = await fetchWithTimeout(event.url);
               const detailHtml = await detailRes.text();
               const $d = cheerio.load(detailHtml);

               let descHtml =
                  $d('#event_description').html()?.trim() ||
                  $d('.event-description, .css-popup-description').html()?.trim() ||
                  $d('#event_description').text().trim() ||
                  $d('.event-description, .css-popup-description').text().trim() ||
                  event.title;

               const extraDetailsHtml = $d('#event_details').html()?.trim();
               if (extraDetailsHtml) {
                  descHtml += '<br><br><strong>Full Details:</strong><br>' + extraDetailsHtml;
               }
               originalDescription = convertRelativeUrls(descHtml, BASE_URL);

               const pureTitle = $d('#event_title').text().trim() || event.title;
               event.title = pureTitle;

               const venuePics: string[] = [];
               $d('img').each((_, el) => {
                  const src = $d(el).attr('src') || '';
                  if (!src) return;

                  if ($d(el).closest('#flyer').length > 0 || $d(el).closest('#host_pic').length > 0) {
                     return;
                  }

                  const lowerSrc = src.toLowerCase();
                  if (
                     lowerSrc.includes('logo') ||
                     lowerSrc.includes('icon') ||
                     lowerSrc.includes('pixel') ||
                     lowerSrc.includes('analytics') ||
                     lowerSrc.includes('assets/') ||
                     lowerSrc.includes('avatar') ||
                     lowerSrc.includes('spacer')
                  ) {
                     return;
                  }

                  const absoluteUrl = src.startsWith('http') ? src : `${BASE_URL}${src}`;
                  if (isValidEventFlyer(absoluteUrl) && !venuePics.includes(absoluteUrl)) {
                     venuePics.push(absoluteUrl);
                  }
               });

               popupData = {
                  image: $d('#flyer img').attr('src') ? ($d('#flyer img').attr('src')!.startsWith('http') ? $d('#flyer img').attr('src') : `${BASE_URL}${$d('#flyer img').attr('src')}`) : '',
                  buyLink: $d('.ml_button a.buy').attr('href') || '',
                  contact: $d('#host_info span.notranslate').text().trim(),
                  hostPic: $d('#host_pic img').attr('src') ? ($d('#host_pic img').attr('src')!.startsWith('http') ? $d('#host_pic img').attr('src') : `${BASE_URL}${$d('#host_pic img').attr('src')}`) : '',
                  theme: $d('.theme-label').text().trim() || 'N/A',
                  price: $d('.price-label').text().trim() || 'N/A',
                  originalUrl: event.url,
                  rawHtmlBlock: ($d('#event_details').html() || descHtml) ?? null,
                  venuePics: venuePics
               };
            } catch (detailErr) {
               console.error(`[Sync] Failed to fetch detail page for ${event.source_id}:`, detailErr);
            }

            let seoTitle = event.title;
            let seoDescription = originalDescription;

            // Gemini SEO rewrites removed
            const slugName = generateSlug(seoTitle, event.source_id);

            await client.query(
               `INSERT INTO public."Partner_Events"
              (source_id, slug_name, original_title, original_description, seo_title, seo_description,
               event_date, event_time, producer, location_name, detail_url, popup_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
               [
                  event.source_id,
                  slugName,
                  event.title,
                  originalDescription,
                  seoTitle,
                  seoDescription,
                  event.date,
                  event.time,
                  event.producer,
                  event.location,
                  event.url,
                  JSON.stringify(popupData),
               ]
            );

            totalProcessed++;
            console.log(`[Sync] Successfully imported. Waiting 2000ms...`);
            await wait(2000);
         }

         currentPage++;
      }

      return NextResponse.json({
         message: 'Full sync loop completed successfully.',
         totalPagesScraped: currentPage - 1,
         totalEventsFound: totalFound,
         newEventsImported: totalProcessed,
      }, { status: 200 });

   } catch (error: any) {
      console.error('[Sync] Fatal error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });

   } finally {
      client.release();
   }
}