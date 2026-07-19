import { env } from '../config/env';
import { sendMail } from '../config/mailer';

function layout(heading: string, body: string, buttonText: string, buttonUrl: string): string {
  return `
  <div style="background:#f6f7fb;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
        <div style="width:36px;height:36px;border-radius:10px;background:#3b5bff;color:#fff;font-weight:700;font-size:18px;text-align:center;line-height:36px">T</div>
        <span style="font-size:18px;font-weight:700;color:#1a1d29">TeamFlow</span>
      </div>
      <h1 style="font-size:20px;color:#1a1d29;margin:0 0 12px">${heading}</h1>
      <p style="font-size:14px;color:#5b6172;line-height:1.6;margin:0 0 24px">${body}</p>
      <a href="${buttonUrl}" style="display:inline-block;background:#3b5bff;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px">${buttonText}</a>
      <p style="font-size:12px;color:#9aa0ad;line-height:1.6;margin:24px 0 0">
        Or copy this link:<br><span style="color:#3b5bff;word-break:break-all">${buttonUrl}</span>
      </p>
      <hr style="border:none;border-top:1px solid #eef0f4;margin:24px 0">
      <p style="font-size:11px;color:#b3b8c2;margin:0">If you didn't request this, you can safely ignore this email.</p>
    </div>
  </div>`;
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const url = `${env.clientUrl}/verify-email?token=${token}`;
  await sendMail({
    to,
    subject: 'Verify your TeamFlow email',
    html: layout(
      `Welcome, ${name}!`,
      'Confirm your email address to activate your TeamFlow account. This link expires in 24 hours.',
      'Verify email',
      url,
    ),
  });
}

interface OverdueItem {
  title: string;
  projectName: string;
  dueDate: Date | null;
  assigneeName: string | null;
}

// Daily digest of overdue tasks, sent to an organization's admins by the cron job.
export async function sendOverdueDigestEmail(
  to: string,
  adminName: string,
  organizationName: string,
  items: OverdueItem[],
) {
  const rows = items
    .map(
      (t) => `
      <tr>
        <td style="padding:10px 12px;border-top:1px solid #eef0f4;font-size:13px;color:#1a1d29">${t.title}</td>
        <td style="padding:10px 12px;border-top:1px solid #eef0f4;font-size:13px;color:#5b6172">${t.projectName}</td>
        <td style="padding:10px 12px;border-top:1px solid #eef0f4;font-size:13px;color:#5b6172">${t.assigneeName ?? 'Unassigned'}</td>
        <td style="padding:10px 12px;border-top:1px solid #eef0f4;font-size:13px;color:#b4342d">${
          t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'
        }</td>
      </tr>`,
    )
    .join('');

  const html = `
  <div style="background:#f6f7fb;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
        <div style="width:34px;height:34px;border-radius:9px;background:#101010;color:#fff;font-weight:700;font-size:17px;text-align:center;line-height:34px">T</div>
        <span style="font-size:17px;font-weight:700;color:#1a1d29">TeamFlow</span>
      </div>
      <h1 style="font-size:19px;color:#1a1d29;margin:0 0 6px">${items.length} overdue task${items.length === 1 ? '' : 's'} in ${organizationName}</h1>
      <p style="font-size:14px;color:#5b6172;line-height:1.5;margin:0 0 20px">Hi ${adminName}, here's your daily overdue summary. These tasks are past their due date and not yet done.</p>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr>
            <th style="text-align:left;padding:0 12px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#9aa0ad">Task</th>
            <th style="text-align:left;padding:0 12px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#9aa0ad">Project</th>
            <th style="text-align:left;padding:0 12px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#9aa0ad">Assignee</th>
            <th style="text-align:left;padding:0 12px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#9aa0ad">Due</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="font-size:12px;color:#9aa0ad;margin:22px 0 0">You receive this because you're an admin of ${organizationName}.</p>
    </div>
  </div>`;

  await sendMail({ to, subject: `${items.length} overdue task(s) — ${organizationName}`, html });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const url = `${env.clientUrl}/reset-password?token=${token}`;
  await sendMail({
    to,
    subject: 'Reset your TeamFlow password',
    html: layout(
      `Hi ${name},`,
      'We received a request to reset your password. Click below to choose a new one. This link expires in 1 hour.',
      'Reset password',
      url,
    ),
  });
}
