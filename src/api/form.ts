import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * Handles the Contact, Spare Parts and Career forms.
 * Submissions are emailed via the Resend API (https://resend.com).
 *
 * Configure in Cloudflare (Workers → Settings → Variables and Secrets):
 *   RESEND_API_KEY  (secret)  – Resend API key
 *   FORM_TO         (var)     – where submissions are delivered, e.g. kiabhutansales@gmail.com
 *   FORM_FROM       (var)     – verified sender, e.g. "Kia Bhutan Website <web@shingkhar.com>"
 */
export const prerender = false;

const FORMS: Record<string, { subject: string; fields: [string, string][] }> = {
  contact: {
    subject: 'Contact enquiry',
    fields: [['f-name', 'First Name'], ['l-name', 'Last Name'], ['your-email', 'Email Address'], ['ph-no', 'Phone No'], ['message', 'Message']],
  },
  'spare-parts': {
    subject: 'Spare parts order',
    fields: [
      ['f-name', 'First Name'], ['l-name', 'Last Name'], ['your-email', 'Email Address'], ['ph-no', 'Phone No'],
      ['yr', 'Year'], ['Model', 'Model'], ['vin', 'VIN'], ['part-no', 'Part No.'], ['part_order', 'Parts Description'],
    ],
  },
  career: {
    subject: 'Career application',
    fields: [
      ['f-name', 'First Name'], ['l-name', 'Last Name'], ['your-email', 'Email Address'], ['ph-no', 'Phone'],
      ['position', 'Position Desired'], ['date_to_start', 'Date you can start'], ['message', 'Message'],
    ],
  },
};
const FILE_FIELDS = ['resume', 'documents'];
const MAX_FILE = 5 * 1024 * 1024;
const ALLOWED_EXT = /\.(pdf|docx?|jpe?g|png)$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function toBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export const POST: APIRoute = async ({ request }) => {
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return json({ ok: false, error: 'Invalid submission.' }, 400);
  }

  // Honeypot: silently accept bot submissions
  if (String(data.get('_gotcha') ?? '')) return json({ ok: true });

  const form = FORMS[String(data.get('_form'))];
  if (!form) return json({ ok: false, error: 'Unknown form.' }, 400);

  const values = form.fields.map(([key, label]) => [label, String(data.get(key) ?? '').trim().slice(0, 5000)] as const);
  const email = String(data.get('your-email') ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  if (!String(data.get('f-name') ?? '').trim()) return json({ ok: false, error: 'Please enter your name.' }, 400);

  const attachments: { filename: string; content: string }[] = [];
  for (const key of FILE_FIELDS) {
    const f = data.get(key);
    if (!(f instanceof File) || f.size === 0) continue;
    if (f.size > MAX_FILE) return json({ ok: false, error: `${f.name} is larger than 5 MB.` }, 400);
    if (!ALLOWED_EXT.test(f.name)) return json({ ok: false, error: `${f.name}: please upload PDF, Word or image files.` }, 400);
    attachments.push({ filename: f.name, content: toBase64(await f.arrayBuffer()) });
  }

  const e = env as unknown as Record<string, string | undefined>;
  if (!e.RESEND_API_KEY || !e.FORM_TO) {
    return json({ ok: false, error: 'Online form is not available right now. Please call or email us.' }, 503);
  }

  const name = `${data.get('f-name') ?? ''} ${data.get('l-name') ?? ''}`.trim();
  const rows = values
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><th align="left" style="padding:6px 12px;background:#f4f5f6">${esc(k)}</th><td style="padding:6px 12px">${esc(v).replace(/\n/g, '<br>')}</td></tr>`)
    .join('');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${e.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: e.FORM_FROM || 'Kia Bhutan Website <onboarding@resend.dev>',
      to: e.FORM_TO.split(',').map((s) => s.trim()),
      reply_to: email,
      subject: `${form.subject} – ${name}`,
      html: `<h2 style="font-family:sans-serif;color:#bc162c">${esc(form.subject)}</h2><table style="font-family:sans-serif;border-collapse:collapse">${rows}</table>`,
      text: values.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n'),
      attachments: attachments.length ? attachments : undefined,
    }),
  });

  if (!res.ok) {
    console.error('Resend error', res.status, await res.text());
    return json({ ok: false, error: 'Sorry, your message could not be sent. Please call or email us.' }, 502);
  }
  return json({ ok: true, message: 'Thank you! We will contact you shortly.' });
};
