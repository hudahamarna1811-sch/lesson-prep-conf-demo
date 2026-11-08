import { isAuthed } from './_auth.js';
import APP_B64 from './_app-data.js';

// الصفحة نفسها لا تُرسل إلا لمن أدخل الرمز الصحيح
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (!isAuthed(req)) {
    res.statusCode = 302;
    res.setHeader('Location', '/');
    return res.end();
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(Buffer.from(APP_B64, 'base64'));
}
