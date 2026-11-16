/**
 * ! We haven't used this file in our template. We've used the server actions in the
 * ! `src/app/server/actions.ts` file to fetch the static data from the fake-db.
 * ! This file has been created to help you understand how you can create your own API routes.
 * ! Only consider making API routes if you're planing to share your project data with other applications.
 * ! else you can use the server actions or third-party APIs to fetch the data from your database.
 */
import { dbPool } from '@/lib/db';


// Next Imports
import { responsiveFontSizes } from '@mui/material';
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';




export async function POST(req: Request) {
    try {
      const { search, excludeProfileId } = await req.json();
      if (!search) {
        return NextResponse.json(
          { exists: false, message: 'Username is required.' },
          { status: 400 }
        );
      }
  
      console.log('Checking if Username exists:', search, 'excluding profile:', excludeProfileId);
  
      // Query to check if the username exists
      let query = `
        SELECT COUNT(*) AS count 
        FROM "UserProfiles"
        WHERE LOWER("Username") = LOWER($1)
      `;
      const values = [search.trim()];

      if (excludeProfileId) {
        query += ` AND "Id" <> $2`;
        values.push(excludeProfileId);
      }
 
      // Execute the query
      const result = await dbPool.query(query, values);
      const exists = parseInt(result.rows[0]?.count, 10) > 0;
  
      console.log(`Username "${search}" exists:`, exists);
  
      return NextResponse.json({ exists });
    } catch (error) {
      console.error('Database query failed:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
  
