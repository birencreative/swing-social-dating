import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";
import crypto from "crypto";

// Database Connection

// Hashing Constants
const SALT_SIZE = 16;
const HASH_ALGORITHM_NAME = "sha256";
const VERSION = 1;

/**
 * Hashes a password with a given salt using SHA-256.
 */
const hashPasswordWithSalt = (password: string, salt: Buffer): Buffer => {
  const hash = crypto.createHash(HASH_ALGORITHM_NAME);
  hash.update(salt);
  hash.update(Buffer.from(password, "utf8"));
  return hash.digest();
};

/**
 * Generates a random salt of a given byte length.
 */
const generateSalt = (byteLength: number): Buffer => {
  return crypto.randomBytes(byteLength);
};

/**
 * Hashes a password using the project's standard algorithm.
 */
const hashPassword = (password: string): string => {
  if (!password) {
    throw new Error("Password cannot be empty.");
  }

  const salt = generateSalt(SALT_SIZE);
  const hash = hashPasswordWithSalt(password, salt);

  // Combine Version (1 byte), Salt (16 bytes), and Hash (32 bytes)
  const combined = Buffer.concat([Buffer.from([VERSION]), salt, hash]);
  return combined.toString("base64");
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, email, password } = body;
    const updatedPassword = body["updated-password"] || body.updatedPassword || body.updated_password || password;
    const targetEmail = email || body.userName || body.username;

    if (!id && !targetEmail) {
      return NextResponse.json(
        { message: "Either ID or Email is required" },
        { status: 400 }
      );
    }

    if (!updatedPassword) {
      return NextResponse.json(
        { message: "Password is required" },
        { status: 400 }
      );
    }

    // 1. Hash the new password
    const hashedPassword = hashPassword(updatedPassword);

    if (id) {
      // 2. Update by ID using public.web_update_user_password
      await dbPool.query(
        "SELECT public.web_update_user_password($1, $2)",
        [id, hashedPassword]
      );

      return NextResponse.json({
        message: "Password updated successfully",
      });
    } else {
      // 3. Update by Email
      const queryByEmail = `SELECT * FROM web_one_profile_email($1)`;
      const checkResult = await dbPool.query(queryByEmail, [targetEmail]);

      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { message: "No registered users found with this email" },
          { status: 404 }
        );
      }

      const updateQuery = `SELECT * FROM admin_update_password_by_email($1, $2)`;
      const updateResult = await dbPool.query(updateQuery, [targetEmail, hashedPassword]);

      if (updateResult.rows.length !== 0) {
        return NextResponse.json({
          message: "Password updated successfully",
        });
      } else {
        return NextResponse.json(
          { message: "Failed to update password" },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error("Password update error:", error);
    return NextResponse.json(
      { message: "Failed to update password", error: error.message },
      { status: 500 }
    );
  }
}
