import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");
    const postId = searchParams.get("postId");

    // Use a high limit and 0 offset to ensure we find the post if it's in the DB
    let query = "SELECT * FROM get_allposts($1, $2, $3)";
    const values: any[] = [userId, 1000, 0]; 

    const postResults = await dbPool.query(query, values);
    let filteredPosts = postResults.rows;
    
    if (postId) {
      // Robust filtering: check both 'Id' and 'id' and handle case sensitivity
      filteredPosts = filteredPosts.filter((post) => {
        const currentId = (post.Id || post.id || "").toString();
        return currentId.toLowerCase() === postId.toLowerCase();
      });
    }

    return NextResponse.json({
      posts: filteredPosts,
    });
  } catch (error) {
    console.error("Database query failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: any) {
  try {
    const { caption, imageUrl, profileId } = await req.json();

    if (!caption || !imageUrl || !profileId) {
      return NextResponse.json(
        { message: "Invalid input data" },
        { status: 400 }
      );
    }

    const result = await dbPool.query(
      "SELECT * FROM insert_post_table_image($1,$2,$3)",
      [profileId, imageUrl, caption]
    );

    return NextResponse.json({
      message: "Post created successfully",
    });
  } catch (error: any) {
    console.error("Error in POST handler:", error);

    return NextResponse.json(
      {
        message: "Post creation failed",
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: any) {
  try {
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json(
        { message: "Invalid input data" },
        { status: 400 }
      );
    }
    const result = await dbPool.query("SELECT * FROM delete_post($1)", [postId]);

    return NextResponse.json({
      message: "Post deleted successfully",
    });
  } catch (error: any) {
    console.error("Error in POST handler:", error);

    return NextResponse.json(
      {
        message: "Post Deletion failed",
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
