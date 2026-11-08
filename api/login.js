import { isAuthed, makeToken, sessionCookie, safeEqual } from './_auth.js';

// حد محاولات بسيط بالذاكرة (يكفي لإبطاء التخمين)
const attempts = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  attempts.set(ip, recent);
  if (attempts.size > 2000) attempts.clear();
  return recent.length > 10;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ authed: isAuthed(req) });
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const expected = process.env.ACCESS_CODE;
  if (!expected) return res.status(500).json({ message: 'رمز الدخول غير مضبوط على الخادم (ACCESS_CODE).' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ message: 'محاولات كثيرة. انتظري عشر دقائق ثم حاولي مجددًا.' });

  const code = req.body && req.body.code;
  if (typeof code !== 'string' || !safeEqual(code, expected)) {
    await sleep(500);
    return res.status(401).json({ message: 'رمز غير صحيح.' });
  }
  res.setHeader('Set-Cookie', sessionCookie(makeToken()));
  return res.status(200).json({ ok: true });
}
