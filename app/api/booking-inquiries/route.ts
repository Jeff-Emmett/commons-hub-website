import { NextResponse } from "next/server";
import { z } from "zod";
import { createItem } from "@/lib/directus/client";
import { sendTransactional } from "@/lib/listmonk/client";

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

  // Best-effort office notification. Skip silently if listmonk transactional
  // template + office subscriber haven't been provisioned yet.
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
