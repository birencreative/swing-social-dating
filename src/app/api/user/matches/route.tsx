import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");
    const match = searchParams.get("match");

    if (match === "Matches") {
      const query = `SELECT * FROM get_matches_list($1)`;

      const postResults = await dbPool.query(query, [userId]);

      return NextResponse.json({
        profiles: postResults.rows,
      });
    } else {
      if (match === "Likes Me") {
        const query = `SELECT * FROM get_likesme($1)`;

        const conditions: string[] = [];
        const values: any[] = [userId, match];
        const postResults = await dbPool.query(query, [userId]);
        return NextResponse.json({
          profiles: postResults.rows,
        });
      } else if (match === "Blocked") {
        const query = `SELECT * FROM get_blocked_profiles($1)`;

        const conditions: string[] = [];
        const values: any[] = [userId, match];
        const postResults = await dbPool.query(query, [userId]);
        return NextResponse.json({
          profiles: postResults.rows,
        });
      } else if (match === "Friends") {
        const query = `SELECT * FROM get_friends_profiles($1)`;

        const conditions: string[] = [];
        const values: any[] = [userId, match];
        const postResults = await dbPool.query(query, [userId]);
        return NextResponse.json({
          profiles: postResults.rows,
        });
      } else {
        const query = `SELECT * FROM get_likes_and_categories($1, $2)`;
        const conditions: string[] = [];
        const values: any[] = [userId, match];
        const postResults = await dbPool.query(query, values);
        return NextResponse.json({
          profiles: postResults.rows,
        });
      }
    }
  } catch (error) {
    console.error("Database query failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
