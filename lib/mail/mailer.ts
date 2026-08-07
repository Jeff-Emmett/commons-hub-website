import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

interface SendArgs {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** Where "Reply" should go (e.g. the customer's email on an inquiry). */
  replyTo?: string;
}

let cached: Transporter | null = null;

function transport(): Transporter | null {
  if (cached) return cached;
  const host = process.env.MAIL_SMTP_HOST;
  const port = Number(process.env.MAIL_SMTP_PORT || 587);
  const user = process.env.MAIL_SMTP_USER;
  const pass = process.env.MAIL_SMTP_PASS;
  if (!host || !user || !pass) return null;
  cached = nodemailer.createTransport({
    host,
    port,
    // STARTTLS on 587, implicit TLS on 465.
    secure: port === 465,
    auth: { user, pass },
  });
  return cached;
}

const ADDRESS_RE = /<\s*([^<>@\s]+@[^<>@\s]+?)\s*>|(?:^|[\s,;])([^<>@\s,;"]+@[^<>@\s,;"]+)/;

/** Drop one pair of wrapping double quotes (Infisical has stored MAIL_FROM that way). */
function unwrapQuotes(value: string): string {
  const v = value.trim();
  return v.length > 1 && v.startsWith('"') && v.endsWith('"')
    ? v.slice(1, -1).trim()
    : v;
}

/** The bare address inside a From header, or null if there isn't one. */
function addressOf(value: string): string | null {
  const m = ADDRESS_RE.exec(value);
  return (m?.[1] || m?.[2] || "").trim() || null;
}

/**
 * Resolve the From header and the SMTP envelope sender separately.
 *
 * Mailcow enforces sender-login ownership, so the envelope sender must always
 * be the authenticated mailbox. Critically, nodemailer derives the envelope
 * from the message headers and falls back to Reply-To when the From header
 * carries no parseable address — which silently put the *customer's* address in
 * MAIL FROM and got every inquiry notification rejected with
 * `553 Sender address rejected: not owned by user`. Pinning the envelope makes
 * a malformed MAIL_FROM cosmetic instead of fatal.
 */
export function resolveFrom(
  configured: string | undefined,
  smtpUser: string,
): { from: string; envelopeFrom: string } {
  const value = unwrapQuotes(configured || "");
  const address = addressOf(value);
  if (address) return { from: value, envelopeFrom: smtpUser };
  if (/\w/.test(value)) {
    // Display name only — keep it, but attach the mailbox we can actually send as.
    console.warn(
      "mail: MAIL_FROM has no email address; treating it as a display name",
    );
    return {
      from: `"${value.replace(/"/g, "")}" <${smtpUser}>`,
      envelopeFrom: smtpUser,
    };
  }
  return { from: smtpUser, envelopeFrom: smtpUser };
}

/**
 * Best-effort SMTP send. Returns true on success, false if SMTP isn't
 * configured or the send threw. Errors are logged, not propagated —
 * caller decides whether a missing notification should fail the request.
 */
export async function sendMail(args: SendArgs): Promise<boolean> {
  const t = transport();
  if (!t) {
    console.warn("mail: SMTP not configured; skipping send", {
      to: args.to,
      subject: args.subject,
    });
    return false;
  }
  const smtpUser = process.env.MAIL_SMTP_USER || "no-reply@localhost";
  const { from, envelopeFrom } = resolveFrom(process.env.MAIL_FROM, smtpUser);
  try {
    await t.sendMail({
      from,
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
      replyTo: args.replyTo,
      // Never let header parsing decide who we authenticate as.
      envelope: { from: envelopeFrom, to: args.to },
    });
    return true;
  } catch (err) {
    console.error("mail: send failed", err);
    return false;
  }
}
