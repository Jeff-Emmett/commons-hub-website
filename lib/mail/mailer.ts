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
  const from =
    process.env.MAIL_FROM || process.env.MAIL_SMTP_USER || "no-reply@localhost";
  try {
    await t.sendMail({
      from,
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
      replyTo: args.replyTo,
    });
    return true;
  } catch (err) {
    console.error("mail: send failed", err);
    return false;
  }
}
