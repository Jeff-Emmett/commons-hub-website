import { NextResponse } from "next/server";
import { subscribe } from "@/lib/listmonk/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { email?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  try {
    await subscribe(email, name);
  } catch (err) {
    console.error("newsletter subscribe failed:", err);
    return NextResponse.json(
      { error: "We couldn't sign you up just now. Please try again later." },
      { status: 502 },
    );
  }

  /* No welcome is sent from here any more. The broker sends the opt-in
     confirmation, and the welcome only once the person actually clicks it —
     which is the difference between a list of people who agreed and a list of
     people who typed their address into a footer. */
  return NextResponse.json({ ok: true, pending: true });
}
