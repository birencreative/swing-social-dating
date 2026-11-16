import { dbPool } from '@/lib/db';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


function calculateDate(age: number): string {
  const currentDate = new Date();
  const year = currentDate.getFullYear() - age;
  const month = currentDate.getMonth() + 1;
  const day = currentDate.getDate();
  const formattedDate = `${month.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}/${year}`;
  return formattedDate;
}

export async function POST(req: any) {
  const { pid, accounttype, age, orientation1, gender1 } = await req.json();

  const birthdayFormat = calculateDate(age);

  try {
    const result = await dbPool.query(
      "SELECT * FROM public.web_update_accounttypetest($1, $2, $3, $4, $5, $6)",
      [pid, accounttype, birthdayFormat, age, orientation1, gender1],
    );

    return NextResponse.json({
      message: "Profile created successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "User Name Update failed",
      },
      { status: 400 },
    );
  }
}
