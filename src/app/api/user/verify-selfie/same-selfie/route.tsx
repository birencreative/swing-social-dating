import { NextResponse } from "next/server";
import {
  RekognitionClient,
  CompareFacesCommand,
  DetectFacesCommand,
} from "@aws-sdk/client-rekognition";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { dbPool } from "@/lib/db";
import FormData from "form-data";
import Mailgun from "mailgun.js";

const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME!;

async function sendEmailNotification({
  userId,
  status,
  reason,
  avatarKey,
  selfieKey,
  similarity,
  confidence,
}: {
  userId: string;
  status: "SUCCESS" | "FAILED";
  reason: string;
  avatarKey: string;
  selfieKey: string;
  similarity?: number;
  confidence?: number;
}) {
  try {
    console.log(`[Email Notification] Starting email send for user ${userId}, status: ${status}`);

    // 1. Fetch user info from DB
    let username = "Unknown";
    try {
      if (userId) {
        const profileRes = await dbPool.query('SELECT * FROM public.web_one_profile($1)', [userId]);
        if (profileRes.rows && profileRes.rows[0]) {
          username = profileRes.rows[0].Username || "Unknown";
        }
      }
    } catch (dbErr) {
      console.error("[Email Notification] DB Query error:", dbErr);
    }

    // 2. Fetch Mailgun Config from DB
    let mailgunKey = "";
    try {
      const configRes = await dbPool.query(
        'SELECT * FROM "Configuration" WHERE "ConfigName" = $1',
        ["EmailApi"]
      );
      mailgunKey = configRes.rows[0]?.ConfigValue || "";
    } catch (configErr) {
      console.error("[Email Notification] Config Query error:", configErr);
    }

    if (!mailgunKey) {
      console.error("[Email Notification] Mailgun key not found in Configuration table. Skipping email.");
      return;
    }

    // 3. Generate presigned URLs for avatar and selfie images in S3
    let avatarUrl = "";
    let selfieUrl = "";
    try {
      if (avatarKey) {
        avatarUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand({ Bucket: BUCKET, Key: avatarKey }),
          { expiresIn: 604800 } // 7 days expiration
        );
      }
      if (selfieKey) {
        selfieUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand({ Bucket: BUCKET, Key: selfieKey }),
          { expiresIn: 604800 } // 7 days expiration
        );
      }
    } catch (s3Err) {
      console.error("[Email Notification] Error generating presigned URLs:", s3Err);
      // Fallback to public bucket URLs
      if (avatarKey) avatarUrl = `https://${BUCKET}.s3.amazonaws.com/${avatarKey}`;
      if (selfieKey) selfieUrl = `https://${BUCKET}.s3.amazonaws.com/${selfieKey}`;
    }

    // 4. Configure status details
    const isSuccess = status === "SUCCESS";
    const statusColor = isSuccess ? "#00D179" : "#FF2D55";
    const statusText = isSuccess ? "VERIFICATION SUCCESS" : "VERIFICATION FAILED";
    const statusIcon = isSuccess
      ? "https://img.icons8.com/color/96/verified-badge.png" // verified badge
      : "https://img.icons8.com/color/96/cancel--v1.png"; // cancel/error badge

    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: "api",
      key: mailgunKey,
    });

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
          <div style="max-width: 650px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <!-- Header Banner -->
            <div style="background-color: ${statusColor}; color: white; padding: 30px 20px; text-align: center;">
              <img src="${statusIcon}" alt="${status}" style="width: 60px; height: 60px; margin-bottom: 10px;"/>
              <h2 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">${statusText}</h2>
            </div>
            
            <!-- Details Section -->
            <div style="padding: 20px 15px;">
              <h3 style="margin-top: 0; color: #1a0b2e; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px;">Verification Details</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; table-layout: fixed;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666; width: 120px; vertical-align: top;">Username:</td>
                  <td style="padding: 8px 0; color: #111; font-size: 15px; vertical-align: top; word-break: break-word;">${username}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666; width: 120px; vertical-align: top;">Profile ID:</td>
                  <td style="padding: 8px 0; font-family: monospace; color: #111; font-size: 14px; vertical-align: top; word-break: break-all;">${userId || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666; width: 120px; vertical-align: top;">Status:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: ${statusColor}; font-size: 15px; vertical-align: top;">${status}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666; width: 120px; vertical-align: top;">Reason:</td>
                  <td style="padding: 8px 0; color: #111; font-size: 15px; vertical-align: top; word-break: break-word;">${reason}</td>
                </tr>
                ${similarity !== undefined ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666; width: 120px; vertical-align: top;">Match Similarity:</td>
                  <td style="padding: 8px 0; color: #111; font-size: 15px; font-weight: bold; vertical-align: top;">${similarity.toFixed(2)}%</td>
                </tr>
                ` : ''}
                ${confidence !== undefined ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666; width: 120px; vertical-align: top;">Face Confidence:</td>
                  <td style="padding: 8px 0; color: #111; font-size: 15px; vertical-align: top;">${confidence.toFixed(2)}%</td>
                </tr>
                ` : ''}
              </table>

              <!-- Image Comparison Section -->
              <h3 style="color: #1a0b2e; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px;">Uploaded Images</h3>
              <div style="text-align: center; margin-top: 15px;">
                <!-- Profile Image -->
                <div style="display: inline-block; width: 100%; max-width: 240px; text-align: center; padding: 10px; box-sizing: border-box; vertical-align: top;">
                  <p style="font-weight: bold; color: #666; margin-top: 0; margin-bottom: 10px; font-size: 14px;">User Profile Image</p>
                  ${avatarUrl ? `
                    <img src="${avatarUrl}" alt="Profile Image" style="width: 160px; height: 160px; object-fit: cover; border-radius: 50%; border: 3px solid #e0e0e0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);"/>
                  ` : `
                    <div style="width: 160px; height: 160px; line-height: 160px; background-color: #f0f0f0; border-radius: 50%; color: #999; margin: 0 auto; font-size: 14px;">No Image</div>
                  `}
                </div>
                <!-- Spacer -->
                <div style="display: inline-block; width: 20px; height: 1px;"></div>
                <!-- Selfie Image -->
                <div style="display: inline-block; width: 100%; max-width: 240px; text-align: center; padding: 10px; box-sizing: border-box; vertical-align: top;">
                  <p style="font-weight: bold; color: #666; margin-top: 0; margin-bottom: 10px; font-size: 14px;">User Selfie Image</p>
                  ${selfieUrl ? `
                    <img src="${selfieUrl}" alt="Selfie Image" style="width: 160px; height: 160px; object-fit: cover; border-radius: 50%; border: 3px solid #e0e0e0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);"/>
                  ` : `
                    <div style="width: 160px; height: 160px; line-height: 160px; background-color: #f0f0f0; border-radius: 50%; color: #999; margin: 0 auto; font-size: 14px;">No Image</div>
                  `}
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await mg.messages.create("swingsocial.co", {
      from: "info@swingsocial.co",
      to: "baldhavansh2505@gmail.com",
      subject: `[Selfie Verification] ${statusText} - ${username}`,
      html: htmlContent,
    });

    console.log(`[Email Notification] Email successfully sent to baldhavansh2505@gmail.com`);
  } catch (emailErr) {
    console.error("[Email Notification] Failed to send email notification:", emailErr);
  }
}

export async function POST(req: Request) {
  let avatarKey = "";
  let selfieKey = "";
  let userId = "";

  try {
    const body = await req.json();
    avatarKey = body.avatarKey;
    selfieKey = body.selfieKey;
    userId = body.userId;

    if (!avatarKey || !selfieKey) {
      return NextResponse.json(
        {
          ok: false,
          match: false,
          reason: "MISSING_S3_KEYS",
          message: "avatarKey and selfieKey are required",
        },
        { status: 400 },
      );
    }

    const selfieDetect = await rekognitionClient.send(
      new DetectFacesCommand({
        Image: {
          S3Object: {
            Bucket: BUCKET,
            Name: selfieKey,
          },
        },
        Attributes: ["ALL"],
      }),
    );

    const selfieFaces = selfieDetect.FaceDetails ?? [];

    if (selfieFaces.length === 0 || selfieFaces.length > 2) {
      await sendEmailNotification({
        userId,
        status: "FAILED",
        reason: "Selfie must contain 1 or 2 faces only",
        avatarKey,
        selfieKey,
      });

      return NextResponse.json(
        {
          ok: false,
          match: false,
          reason: "INVALID_SELFIE",
          message: "Selfie must contain 1 or 2 faces only",
        },
        { status: 400 },
      );
    }

    const validSelfieFaces = selfieFaces.filter(
      (face) =>
        face.Confidence &&
        face.Confidence >= 85 &&
        face.EyesOpen?.Value !== false &&
        face.Sunglasses?.Value !== true,
    );

    if (validSelfieFaces.length === 0) {
      await sendEmailNotification({
        userId,
        status: "FAILED",
        reason: "No clear face found in selfie (eyes closed, sunglasses, or low confidence)",
        avatarKey,
        selfieKey,
      });

      return NextResponse.json(
        {
          ok: false,
          match: false,
          reason: "BAD_SELFIE_QUALITY",
          message:
            "No clear face found in selfie (eyes closed, sunglasses, or low confidence)",
        },
        { status: 400 },
      );
    }

    const avatarDetect = await rekognitionClient.send(
      new DetectFacesCommand({
        Image: {
          S3Object: {
            Bucket: BUCKET,
            Name: avatarKey,
          },
        },
      }),
    );

    const avatarFaces = avatarDetect.FaceDetails ?? [];

    if (avatarFaces.length === 0 || avatarFaces.length > 2) {
      await sendEmailNotification({
        userId,
        status: "FAILED",
        reason: "Profile photo must contain 1 or 2 faces only",
        avatarKey,
        selfieKey,
      });

      return NextResponse.json(
        {
          ok: false,
          match: false,
          reason: "INVALID_PROFILE_PHOTO",
          message: "Profile photo must contain 1 or 2 faces only",
        },
        { status: 400 },
      );
    }

    const compare = await rekognitionClient.send(
      new CompareFacesCommand({
        SourceImage: {
          S3Object: {
            Bucket: BUCKET,
            Name: selfieKey,
          },
        },
        TargetImage: {
          S3Object: {
            Bucket: BUCKET,
            Name: avatarKey,
          },
        },
        SimilarityThreshold: 65,
        QualityFilter: "AUTO",
      }),
    );

    const matches = compare.FaceMatches ?? [];

    if (!matches.length) {
      await sendEmailNotification({
        userId,
        status: "FAILED",
        reason: "No face in the selfie matches any face in the profile photo",
        avatarKey,
        selfieKey,
        similarity: 0,
      });

      return NextResponse.json({
        ok: true,
        match: false,
        verified: false,
        message: "No face in the selfie matches any face in the profile photo",
        similarity: 0,
      });
    }

    const bestMatch = matches.reduce((prev, curr) =>
      (curr.Similarity ?? 0) > (prev.Similarity ?? 0) ? curr : prev,
    );

    await sendEmailNotification({
      userId,
      status: "SUCCESS",
      reason: "Selfie successfully matched with profile picture",
      avatarKey,
      selfieKey,
      similarity: bestMatch.Similarity,
      confidence: bestMatch.Face?.Confidence,
    });

    return NextResponse.json({
      ok: true,
      match: true,
      verified: true,
      verifiedBy: "ANY_FACE_MATCH",
      similarity: bestMatch.Similarity,
      confidence: bestMatch.Face?.Confidence,
      userId,
    });
  } catch (err: any) {
    console.error("AWS ERROR:", err);

    await sendEmailNotification({
      userId,
      status: "FAILED",
      reason: err.message || "AWS Rekognition failed",
      avatarKey,
      selfieKey,
    });

    return NextResponse.json(
      {
        ok: false,
        match: false,
        message: err.message || "AWS Rekognition failed",
      },
      { status: 500 },
    );
  }
}
