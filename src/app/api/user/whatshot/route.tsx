import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM get_allposts($1, $2, $3)`;
    const values = [userId, limit, offset];

    const postResults = await dbPool.query(query, values);

    const totalCount = postResults.rows.length > 0 ? parseInt(postResults.rows[0].TotalCount) : 0;

    return NextResponse.json({
      posts: postResults.rows,
      totalCount: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
