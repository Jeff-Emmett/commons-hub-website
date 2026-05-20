import { NextResponse } from "next/server";
import { z } from "zod";
import { createItem } from "@/lib/directus/client";
import { sendTransactional } from "@/lib/listmonk/client";
import { sendMail } from "@/lib/mail/mailer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const baseSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .regex(EMAIL_RE, { message: "Please enter a valid email address" }),
  check_in: z.string().regex(ISO_DATE_RE).optional(),
  check_out: z.string().regex(ISO_DATE_RE).optional(),
  message: z.string().trim().max(5000).optional(),
  estimated_total_eur: z.number().nonnegative().optional(),
});

const staySchema = baseSchema.extend({
  inquiry_type: z.literal("stay"),
  guests: z.number().int().min(1).max(200),
  room_type: z.enum(["single", "double_twin", "double_king", "shared"]).optional(),
});

const eventSchema = baseSchema.extend({
  inquiry_type: z.literal("event"),
  event_size_package: z.enum(["small", "medium", "large", "xlarge", "call"]),
  event_title: z.string().trim().max(200).optional(),
  event_description: z.string().trim().max(5000).optional(),
});

const inquirySchema = z.discriminatedUnion("inquiry_type", [staySchema, eventSchema]);

const LISTMONK_BOOKING_TEMPLATE_ID = Number.parseInt(
  process.env.LISTMONK_BOOKING_TEMPLATE_ID || "0",
  10,
);
const LISTMONK_OFFICE_EMAIL = process.env.LISTMONK_OFFICE_EMAIL || "";

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = inquirySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid inquiry", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Cross-field validation for dates
  if (data.check_in && data.check_out && data.check_out <= data.check_in) {
    return NextResponse.json(
      { error: "Check-out must be after check-in." },
      { status: 400 },
    );
  }

  let created: { id?: number } | null;
  try {
    created = await createItem<Record<string, unknown>>(
      "booking_inquiries",
      data as Record<string, unknown>,
    ) as { id?: number } | null;
  } catch (err) {
    console.error("booking-inquiries: directus insert failed", err);
    return NextResponse.json(
      { error: "We couldn't record your inquiry just now. Please try again." },
      { status: 502 },
    );
  }

  // Best-effort SMTP notification to the office. From is our Mailcow-
  // authenticated sender; Reply-To is the customer so a "Reply" replies
  // directly to them. Skips silently when SMTP env isn't configured.
  const officeTo = process.env.MAIL_TO_OFFICE;
  if (officeTo) {
    const lines: string[] = [];
    const push = (label: string, value: unknown) => {
      if (value !== undefined && value !== null && value !== "") {
        lines.push(`${label}: ${String(value)}`);
      }
    };
    push("Name", data.name);
    push("Email", data.email);
    if (data.inquiry_type === "stay") {
      push("Guests", data.guests);
      push("Room type", data.room_type);
      push("Check-in", data.check_in);
      push("Check-out", data.check_out);
    } else {
      push("Event size", data.event_size_package);
      push("Event title", data.event_title);
      push("Start", data.check_in);
      push("End", data.check_out);
      push("Description", data.event_description);
    }
    push("Estimated total (EUR)", data.estimated_total_eur);
    push("Message", data.message);
    push("Directus inquiry id", created?.id);
    const text = lines.join("\n");
    const safe = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const subject =
      data.inquiry_type === "stay"
        ? `Stay inquiry — ${data.name}`
        : `Event inquiry — ${data.name}${
            data.event_title ? ` (${data.event_title})` : ""
          }`;
    await sendMail({
      to: officeTo,
      subject,
      text,
      html:
        `<p>New ${data.inquiry_type} inquiry on commons-hub.at:</p>` +
        `<pre style="font-family:ui-monospace,monospace;font-size:13px;background:#f6f6f6;padding:12px;border-radius:6px;white-space:pre-wrap">${safe}</pre>`,
      replyTo: data.email,
    });
  }

  // Optional legacy path: Listmonk transactional. Skip silently if not
  // provisioned (template id + office subscriber).
  if (LISTMONK_BOOKING_TEMPLATE_ID && LISTMONK_OFFICE_EMAIL) {
    try {
      await sendTransactional({
        templateId: LISTMONK_BOOKING_TEMPLATE_ID,
        recipientEmail: LISTMONK_OFFICE_EMAIL,
        data: {
          ...data,
          inquiry_id: created?.id,
          received_at: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error("booking-inquiries: office notification failed", err);
      // Don't fail the request — inquiry is already stored.
    }
  }

  return NextResponse.json({ ok: true, id: created?.id });
}
