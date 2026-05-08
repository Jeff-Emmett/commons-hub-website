import { NextResponse } from "next/server";
import { subscribe, sendWelcome } from "@/lib/listmonk/client";

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

  try {
    await sendWelcome(email);
  } catch (err) {
    console.error("newsletter welcome send failed:", err);
    return NextResponse.json({
      ok: true,
      welcomeEmailQueued: false,
    });
  }

  return NextResponse.json({ ok: true, welcomeEmailQueued: true });
}
