import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("loginInfo")?.value;

  if (request.nextUrl.pathname === "/") {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    } else {
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
