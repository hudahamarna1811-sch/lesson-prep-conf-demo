// أدوات التحقق من الجلسة (الملفات التي تبدأ بـ _ لا تُنشر كنقاط وصول)
import crypto from 'node:crypto';

const COOKIE = 'lp_session';
const MAX_AGE = 60 * 60 * 12; // 12 ساعة

// مفتاح التوقيع يعتمد على ACCESS_CODE، فتغيير الرمز يُبطل كل الجلسات القائمة تلقائيًا
function key() {
  return `${process.env.ACCESS_CODE || ''}|${process.env.SESSION_SECRET || ''}`;
}
function sign(payload) {
  return crypto.createHmac('sha256', key()).update(payload).digest('hex');
}
export function makeToken() {
  const p = String(Date.now() + MAX_AGE * 1000);
  return `${p}.${sign(p)}`;
}
export function verifyToken(tok) {
  if (!process.env.ACCESS_CODE || !tok) return false;
  const [p, sig] = String(tok).split('.');
  if (!p || !sig) return false;
  const exp = Number(p);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(p));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}
export function isAuthed(req) {
  return verifyToken(getCookie(req, COOKIE));
}
export function sessionCookie(token) {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`;
}
export function safeEqual(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}
