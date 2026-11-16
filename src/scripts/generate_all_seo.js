const { Pool } = require('pg');

// Setup database connection from environment variables
const pool = new Pool({
  user: process.env.DB_USER || 'clark',
  host: process.env.DB_HOST || '199.244.49.83',
  database: process.env.DB_NAME || 'swingsocialdb',
  password: process.env.DB_PASSWORD || 'Jaguar2020#',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

// Handle unexpected connection errors on idle clients
pool.on('error', (err) => {
  console.error('[Database Pool Error]:', err.message);
});

const openAiApiKey = process.env.OPENAI_API_KEY || "";

if (!openAiApiKey) {
  console.error("Error: OPENAI_API_KEY is not configured in .env.local.");
  process.exit(1);
}

// Clean HTML tag stripper
function stripHtml(text) {
  return (text || "")
    .replace(/<[^>]*>?/gm, "")
    .trim();
}

async function generateEventSeo(name, description, category, venue, dateTime) {
  const cleanDescription = stripHtml(description).substring(0, 1000);

  const prompt = `You are a professional SEO specialist. Generate an optimized SEO Meta Title and Meta Description for the following event details:

Event Name: ${name}
Description: ${cleanDescription}
Category: ${category}
Location/Venue: ${venue}
Date/Time: ${dateTime}

Guidelines:
1. SEO Meta Title: Must be between 50-60 characters. Format: "[Event Name] - [City/Location] | Swing Social". Make it engaging.
2. SEO Meta Description: Must be between 120-155 characters. Summarize the event clearly, incorporate the location, and end with an action-oriented call to action (e.g. "Register on Swing Social", "Join lifestyle couples now").
3. Avoid generic terms. Keep descriptions exciting yet descriptive.

Return ONLY a valid JSON object matching this schema:
{
  "seoTitle": "string",
  "seoDescription": "string"
}
Do not include any markdown formatting (like \`\`\`json), comments, or introductory text. Just return raw JSON.`;

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      console.log(`[AI SEO] Calling OpenAI API (gpt-4o-mini) for "${name}"...`);
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are a professional SEO specialist. You generate meta titles and meta descriptions in JSON format.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API status: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content.trim();
      const parsed = JSON.parse(responseText);

      if (parsed.seoTitle && parsed.seoDescription) {
        return {
          seoTitle: parsed.seoTitle.trim(),
          seoDescription: parsed.seoDescription.trim(),
        };
      }
    } catch (openAiError) {
      const isRateLimit = openAiError.message && (openAiError.message.includes("429") || openAiError.message.includes("403"));
      if (isRateLimit && attempt < maxRetries - 1) {
        console.warn(`[AI SEO Generator] OpenAI rate limit/error. Waiting 10 seconds before retrying (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempt++;
        continue;
      }
      console.error(`[AI SEO Generator] OpenAI failed for "${name}":`, openAiError.message);
      break;
    }
  }

  // Fallback template if generation fails
  const fallbackTitle = name ? `${name} - ${venue} | Swing Social` : "Event Details | Swing Social";
  const fallbackDesc = cleanDescription
    ? cleanDescription.substring(0, 150) + "..."
    : `Join us for ${name || "our lifestyle event"} at ${venue || "TBD"} on ${dateTime || "TBD"}.`;
  return {
    seoTitle: fallbackTitle.substring(0, 60),
    seoDescription: fallbackDesc.substring(0, 155),
  };
}

async function main() {
  try {
    console.log("Starting bulk SEO generation for all events...");

    // 1. Fetch user events missing SEO
    console.log("Checking User Events table...");
    const userEventsRes = await pool.query(`
      SELECT "Id", "Name", "Description", "Category", "Venue", "StartTime"
      FROM public."Events"
      WHERE "seo_title" IS NULL OR "seo_title" = ''
    `);
    const totalUserEvents = userEventsRes.rows.length;
    console.log(`Found ${totalUserEvents} user events missing SEO metadata.`);

    // 2. Fetch partner events missing SEO
    console.log("Checking Partner Events table...");
    const partnerEventsRes = await pool.query(`
      SELECT id, original_title, original_description, location_name, event_date, event_time, popup_data
      FROM public."Partner_Events"
      WHERE seo_title IS NULL OR seo_title = '' OR seo_title = original_title
    `);
    const totalPartnerEvents = partnerEventsRes.rows.length;
    console.log(`Found ${totalPartnerEvents} partner events missing/needing SEO metadata.`);

    const totalToProcess = totalUserEvents + totalPartnerEvents;
    console.log(`Total events to optimize: ${totalToProcess}\n`);

    let processedCount = 0;

    // Process User Events
    for (let i = 0; i < totalUserEvents; i++) {
      const event = userEventsRes.rows[i];
      const title = event.Name || "Event";
      const desc = event.Description || "";
      const category = event.Category || "Lifestyle Event";
      const venue = event.Venue || "TBA";
      const date = event.StartTime ? new Date(event.StartTime).toLocaleString("en-US", { timeZone: "America/New_York" }) : "TBA";

      console.log(`[${processedCount + 1}/${totalToProcess}] Generating SEO for User Event: "${title}"`);
      const seo = await generateEventSeo(title, desc, category, venue, date);

      await pool.query(
        `UPDATE public."Events" SET "seo_title" = $1, "seo_description" = $2 WHERE "Id" = $3::uuid`,
        [seo.seoTitle, seo.seoDescription, event.Id]
      );

      processedCount++;
      // Sleep to prevent rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Process Partner Events
    for (let i = 0; i < totalPartnerEvents; i++) {
      const event = partnerEventsRes.rows[i];
      const title = event.original_title || "Partner Event";
      let popupData = {};
      try {
        popupData = typeof event.popup_data === "string" ? JSON.parse(event.popup_data) : event.popup_data;
      } catch {}

      const desc = popupData?.rawHtmlBlock || event.original_description || event.seo_description || "";
      const venue = event.location_name || "TBA";
      const date = `${event.event_date || ""} ${event.event_time || ""}`.trim();

      console.log(`[${processedCount + 1}/${totalToProcess}] Generating SEO for Partner Event: "${title}"`);
      const seo = await generateEventSeo(title, desc, "Partner Event", venue, date);

      await pool.query(
        `UPDATE public."Partner_Events" SET seo_title = $1, seo_description = $2 WHERE id = $3`,
        [seo.seoTitle, seo.seoDescription, event.id]
      );

      processedCount++;
      // Sleep to prevent rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\nSuccess! All ${processedCount} events updated successfully with AI-optimized SEO metadata!`);
  } catch (err) {
    console.error("Bulk process error:", err);
  } finally {
    await pool.end();
  }
}

main();
