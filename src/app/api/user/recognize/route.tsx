import { dbPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export  async function GET(req: any) {
  
  try {


    // Query to fetch only the avatar column
    const query = `
      SELECT "Avatar"
      FROM "UserProfiles"
      WHERE "CreatedAt" BETWEEN $1 AND $2
        AND "Avatar" IS NOT NULL;
    `;

    // Parameters for the query
    const values = [
      '2025-01-01', // Start date
      new Date().toISOString(), // Current date in ISO string format
    ];

    // Execute the query
    const result = await dbPool.query(query, values);

    console.log('Avatars:', result.rows);

    // Return only the avatar data
    return NextResponse.json({
                message: result.rows,
            })
  } catch (error) {
    console.error('Error fetching avatars:', error);
    return NextResponse.json({
        message: 'Profile created successfully',
    })
  }
}