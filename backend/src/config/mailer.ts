import nodemailer from 'nodemailer';
import { env } from './env';

export const isMailerConfigured = Boolean(env.mail.user && env.mail.pass);

// Gmail SMTP transport. Port 465 = implicit TLS (secure), 587 = STARTTLS.
export const transporter = nodemailer.createTransport({
  host: env.mail.host,
  port: env.mail.port,
  secure: env.mail.port === 465,
  auth: { user: env.mail.user, pass: env.mail.pass },
});

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

// Sends an email; if SMTP isn't configured, logs instead of throwing so
// the app still works in local/dev without credentials.
export async function sendMail({ to, subject, html }: SendArgs): Promise<void> {
  if (!isMailerConfigured) {
    console.warn(`[mailer] SMTP not configured — skipping email to ${to} ("${subject}")`);
    return;
  }
  await transporter.sendMail({ from: env.mail.from, to, subject, html });
}
