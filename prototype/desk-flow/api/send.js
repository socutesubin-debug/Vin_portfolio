// CONTACT 메일 보내기 (Vercel 서버 함수)
// 방문자가 메일 창에서 '보내기'를 누르면 이 함수가 EmailJS로 메일을 보내요.
// 키는 코드에 없고, Vercel 환경 변수(로컬은 .env.local)에서만 읽어요.
//   EMAILJS_SERVICE_ID · EMAILJS_TEMPLATE_ID · EMAILJS_PUBLIC_KEY · EMAILJS_PRIVATE_KEY
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clip = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'method' }); }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  if (body.website) return res.status(200).json({ ok: true });   // 스팸 로봇이 숨은 칸을 채우면 조용히 무시
  const from = clip(body.from, 120), subject = clip(body.subject, 150), message = clip(body.message, 5000);
  if (!EMAIL_RE.test(from)) return res.status(400).json({ ok: false, error: 'from' });
  if (message.length < 2) return res.status(400).json({ ok: false, error: 'message' });

  const { EMAILJS_SERVICE_ID: service_id, EMAILJS_TEMPLATE_ID: template_id, EMAILJS_PUBLIC_KEY: user_id, EMAILJS_PRIVATE_KEY: accessToken } = process.env;
  if (!service_id || !template_id || !user_id) return res.status(503).json({ ok: false, error: 'config' });

  try {
    const r = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id, template_id, user_id, ...(accessToken ? { accessToken } : {}),
        template_params: { from_email: from, reply_to: from, subject: subject || '포트폴리오에서 온 메시지', message, sent_at: new Date().toISOString() },
      }),
    });
    if (!r.ok) { console.error('emailjs', r.status, await r.text().catch(() => '')); return res.status(502).json({ ok: false, error: 'send' }); }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('emailjs', e && e.message);
    return res.status(502).json({ ok: false, error: 'send' });
  }
}
