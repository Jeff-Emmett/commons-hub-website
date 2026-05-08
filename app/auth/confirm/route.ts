import { NextResponse, type NextRequest } from "next/server";

// The Supabase email-confirm flow no longer applies — Directus handles auth.
// Redirect any stale confirmation link to the login page.
export async function GET(_request: NextRequest) {
  return NextResponse.redirect(new URL("/auth/login", _request.url));
}
