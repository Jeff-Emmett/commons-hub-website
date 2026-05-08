import { NextResponse } from "next/server";
import { logout } from "@/lib/directus/auth";

export async function POST() {
  await logout();
  return NextResponse.json({ ok: true });
}
