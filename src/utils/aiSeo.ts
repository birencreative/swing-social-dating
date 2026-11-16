import { config } from "@/config";

const openAiApiKey = config.openai.apiKey || process.env.OPENAI_API_KEY || "";

export interface GeneratedSeo {
  seoTitle: string;
  seoDescription: string;
}

export async function generateEventSeo(
  name: string,
  description: string,
  category: string,
  venue: string,
  dateTime: string
): Promise<GeneratedSeo> {
  if (!openAiApiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not configured.");
  }

  // Strip HTML from description to keep prompt smaller and clean
  const cleanDescription = (description || "")
    .replace(/<[^>]*>?/gm, "")
    .trim()
    .substring(0, 1000); // truncate if too long

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
      throw new Error(`OpenAI API responded with status ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content.trim();
    const parsed: GeneratedSeo = JSON.parse(responseText);

    if (!parsed.seoTitle || !parsed.seoDescription) {
      throw new Error("Missing required fields in OpenAI response.");
    }

    return {
      seoTitle: parsed.seoTitle.trim(),
      seoDescription: parsed.seoDescription.trim(),
    };
  } catch (error: any) {
    console.error("[AI SEO] OpenAI generation failed:", error.message);
    
    // Return a clean fallback based on input
    const fallbackTitle = name ? `${name} - ${venue} | Swing Social` : "Event Details | Swing Social";
    const fallbackDesc = cleanDescription
      ? cleanDescription.substring(0, 150) + "..."
      : `Join us for ${name || "our lifestyle event"} at ${venue || "TBD"} on ${dateTime || "TBD"}.`;
    return {
      seoTitle: fallbackTitle.substring(0, 60),
      seoDescription: fallbackDesc.substring(0, 155),
    };
  }
}
