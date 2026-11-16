import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawTerm = (searchParams.get("state") || searchParams.get("city") || "").trim();

    if (!rawTerm) {
      const fallbackQuery = `
        SELECT "StateFull", "State"
        FROM "UsStates"
        ORDER BY "StateFull"
        LIMIT 50
      `;
      const fallbackRes = await dbPool.query(fallbackQuery);
      return NextResponse.json({
        states: fallbackRes.rows.map((row, i) => ({
          id: i,
          StateFull: row.StateFull,
          State: row.State,
        })),
        cities: fallbackRes.rows.map((row, i) => ({
          id: i,
          City: row.StateFull,
        })),
      });
    }

    const searchPattern = `%${rawTerm}%`;
    const startsWithPattern = `${rawTerm}%`;

    const query = `
      SELECT "StateFull", "State"
      FROM (
        SELECT "City" || ', ' || "State" AS "StateFull", "State"
        FROM "UsCities"
        WHERE "City" ILIKE $1
           OR "State" ILIKE $1
           OR ("City" || ', ' || "State") ILIKE $1
        UNION
        SELECT "StateFull", "State"
        FROM "UsStates"
        WHERE "StateFull" ILIKE $1
           OR "State" ILIKE $1
      ) AS combined
      ORDER BY 
        CASE WHEN "StateFull" ILIKE $2 THEN 0 ELSE 1 END,
        "StateFull" ASC
      LIMIT 100
    `;

    const result = await dbPool.query(query, [searchPattern, startsWithPattern]);

    const seen = new Set<string>();
    const deduplicatedRows: any[] = [];
    for (const row of result.rows) {
      const key = `${(row.StateFull || "").replace(/,/g, "").replace(/\s+/g, " ").trim().toLowerCase()}_${(row.State || "").trim().toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicatedRows.push(row);
      }
    }

    return NextResponse.json({
      states: deduplicatedRows.map((row, i) => ({
        id: i,
        StateFull: row.StateFull,
        State: row.State,
      })),
      cities: deduplicatedRows.map((row, i) => ({
        id: i,
        City: row.StateFull,
      })),
    });
  } catch (error) {
    console.error("Location search error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
