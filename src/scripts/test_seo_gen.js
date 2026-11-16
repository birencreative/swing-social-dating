const { Pool } = require('pg');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Setup database connection from environment variables
const pool = new Pool({
  user: process.env.DB_USER || 'clark',
  host: process.env.DB_HOST || '199.244.49.83',
  database: process.env.DB_NAME || 'swingsocialdb',
  password: process.env.DB_PASSWORD || 'Jaguar2020#',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

const openAiApiKey = process.env.OPENAI_API_KEY || "";
const geminiApiKey = process.env.GEMINI_API_KEY || "";
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

async function generateEventSeo(name, description, category, venue, dateTime) {
  const cleanDescription = (description || "")
    .replace(/<[^>]*>?/gm, "")
    .trim()
    .substring(0, 1000);

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

  if (openAiApiKey) {
    try {
      console.log(`[Test AI SEO] Calling OpenAI API (gpt-4o-mini)...`);
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

      if (response.ok) {
        const data = await response.json();
        const responseText = data.choices[0].message.content.trim();
        const parsed = JSON.parse(responseText);
        if (parsed.seoTitle && parsed.seoDescription) {
          return {
            seoTitle: parsed.seoTitle.trim(),
            seoDescription: parsed.seoDescription.trim(),
          };
        }
      } else {
        console.log(`[Test AI SEO] OpenAI returned status: ${response.status}`);
      }
    } catch (openAiError) {
      console.error("[Test AI SEO] OpenAI generation failed:", openAiError.message);
    }
  }

  if (genAI) {
    try {
      console.log(`[Test AI SEO] Calling Gemini API (gemini-1.5-flash)...`);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();

      let cleanedJson = responseText;
      if (cleanedJson.startsWith("```")) {
        cleanedJson = cleanedJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }

      const parsed = JSON.parse(cleanedJson);
      if (parsed.seoTitle && parsed.seoDescription) {
        return {
          seoTitle: parsed.seoTitle.trim(),
          seoDescription: parsed.seoDescription.trim(),
        };
      }
    } catch (geminiError) {
      console.error("[Test AI SEO] Gemini generation failed:", geminiError.message);
    }
  }

  throw new Error("Both OpenAI and Gemini AI generation failed or are unconfigured.");
}

async function main() {
  const client = await pool.connect();
  try {
    console.log("Fetching one recent event from 'Events' table for testing...");
    const res = await client.query(`
      SELECT "Id", "Name", "Description", "Category", "Venue", "StartTime"
      FROM public."Events"
      ORDER BY "CreatedAt" DESC
      LIMIT 1
    `);

    if (res.rows.length === 0) {
      console.log("No events found in 'Events' table.");
      return;
    }

    const event = res.rows[0];
    console.log(`\n--- Test Event Found ---`);
    console.log(`ID: ${event.Id}`);
    console.log(`Name: ${event.Name}`);
    console.log(`Venue: ${event.Venue}`);
    console.log(`Category: ${event.Category}`);
    console.log(`Start Time: ${event.StartTime}`);

    console.log(`\nGenerating SEO Metadata...`);
    const seo = await generateEventSeo(
      event.Name,
      event.Description,
      event.Category,
      event.Venue,
      event.StartTime ? event.StartTime.toString() : 'TBA'
    );

    console.log(`\n--- Generated SEO Results ---`);
    console.log(`SEO Meta Title: ${seo.seoTitle}`);
    console.log(`SEO Meta Description: ${seo.seoDescription}`);
    console.log(`Length Title: ${seo.seoTitle.length} chars (Recommended: 50-60)`);
    console.log(`Length Description: ${seo.seoDescription.length} chars (Recommended: 120-155)`);
    console.log(`\nTest completed successfully!`);
  } catch (err) {
    console.error("\nTest failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
