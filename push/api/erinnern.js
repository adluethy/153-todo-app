/* Läuft jede Minute (Vercel Cron, siehe vercel.json): fällige Erinnerungen abholen und schicken.
   Die Datenbank-Funktion claim_due_reminders() vermerkt jede Erinnerung beim Abholen,
   damit nichts doppelt kommt. Klappt der Versand nur vorübergehend nicht, wird der Vermerk
   wieder gelöscht und es in der nächsten Minute nochmals versucht (bis 6 Std. nach dem Zeitpunkt). */
import { admin, sendTo, erinnerung } from '../lib/push.js';

export default async function handler(req, res, deps = {}) {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Nicht erlaubt' });
    return;
  }
  try {
    const db = deps.db || admin();
    const { data: faellig, error } = await db.rpc('claim_due_reminders');
    if (error) throw error;

    const summe = { reminders: faellig.length, ok: 0, failed: 0, retry: 0 };
    for (const r of faellig) {
      const result = await sendTo(db, r.user_id, erinnerung(r), deps.send);
      summe.ok += result.ok;
      summe.failed += result.failed;
      if (result.ok === 0 && result.transient > 0) {
        summe.retry++;
        await db.from('reminders_sent').delete()
          .match({ todo_id: r.todo_id, user_id: r.user_id, offset_min: r.offset_min });
      }
    }
    if (faellig.length) console.log('Erinnerungen', JSON.stringify(summe));
    res.status(200).json(summe);
  } catch (err) {
    console.error('Erinnerungen fehlgeschlagen', err);
    res.status(500).json({ error: err.message || String(err) });
  }
}
