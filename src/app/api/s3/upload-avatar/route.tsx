import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const BUCKET = process.env.S3_BUCKET_NAME!;

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const { userId, avatarUrl } = await req.json();

    if (!userId || !avatarUrl) {
      return NextResponse.json(
        { ok: false, error: "MISSING_PARAMS" },
        { status: 400 },
      );
    }

    console.log(`[upload-avatar] Starting S3 upload workflow for user: ${userId}`);
    const fetchStart = Date.now();
    const imgRes = await fetch(avatarUrl);
    if (!imgRes.ok) throw new Error("IMAGE_FETCH_FAILED");

    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`[upload-avatar] Cloudinary fetch completed in ${Date.now() - fetchStart}ms (Size: ${buffer.length} bytes)`);

    const key = `avatars/${userId}.jpg`;

    const uploadStart = Date.now();
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: "image/jpeg",
      }),
    );
    console.log(`[upload-avatar] S3 PutObject completed in ${Date.now() - uploadStart}ms`);
    console.log(`[upload-avatar] Total API route execution time: ${Date.now() - startTime}ms`);

    return NextResponse.json({
      ok: true,
      key,
      url: `https://swingsocial-face-verification.s3.amazonaws.com/${key}`,
    });
  } catch (error: any) {
    console.error("UPLOAD_AVATAR_ERROR:", error);

    return NextResponse.json(
      { ok: false, error: error.message || "UPLOAD_FAILED" },
      { status: 500 },
    );
  }
}
