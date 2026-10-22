/* "Test-Mitteilung senden" aus dem Menü der App: schickt eine Mitteilung an alle Geräte
   der angemeldeten Person. Die App schickt ihr Login (Supabase-Token) mit. */
import { admin, sendTo, cors } from '../lib/push.js';

export default async function handler(req, res, deps = {}) {
  cors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Nur POST' });
    return;
  }
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'Nicht angemeldet' });
    return;
  }
  try {
    const db = deps.db || admin();
    const { data, error } = await db.auth.getUser(token);
    if (error || !data || !data.user) {
      res.status(401).json({ error: 'Nicht angemeldet' });
      return;
    }
    const result = await sendTo(db, data.user.id, {
      title: 'Test-Mitteilung',
      body: 'Erinnerungen kommen auf diesem Gerät an.',
      tag: 'test',
      url: './',
    }, deps.send);
    res.status(200).json(result);
  } catch (err) {
    console.error('Test-Mitteilung fehlgeschlagen', err);
    res.status(500).json({ error: err.message || String(err) });
  }
}
