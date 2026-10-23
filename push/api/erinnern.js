/* Läuft jede Minute (Vercel Cron, siehe vercel.json):
   1. Fällige Erinnerungen abholen und schicken. Die Datenbank-Funktion claim_due_reminders() vermerkt
      jede Erinnerung beim Abholen, damit nichts doppelt kommt. Klappt der Versand nur vorübergehend
      nicht, wird der Vermerk wieder gelöscht und es in der nächsten Minute nochmals versucht
      (bis 6 Std. nach dem Zeitpunkt).
   2. Neue Einträge der anderen Person melden (claim_new_entries(): Gemmel und eigener Reiter),
      gebündelt pro Person, nur an Geräte mit eingeschaltetem Schalter. Eigener Fehlerbereich:
      stört die Erinnerungen nie. Kein zweiter Versuch (eine verpasste Meldung ist kein Termin). */
import { admin, sendTo, erinnerung, neuigkeiten } from '../lib/push.js';

export default async function handler(req, res, deps = {}) {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Nicht erlaubt' });
    return;
  }
  try {
    const db = deps.db || admin();
    const { data: faellig, error } = await db.rpc('claim_due_reminders');
    if (error) throw error;

    const summe = { reminders: faellig.length, news: 0, ok: 0, failed: 0, retry: 0 };
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

    try {
      const { data: neu, error: fehlerNeu } = await db.rpc('claim_new_entries');
      if (fehlerNeu) throw fehlerNeu;
      summe.news = neu.length;
      for (const { userId, message } of neuigkeiten(neu)) {
        const result = await sendTo(db, userId, message, deps.send, true);
        summe.ok += result.ok;
        summe.failed += result.failed;
      }
    } catch (err) {
      console.error('Neue Einträge fehlgeschlagen', err.message || err);
      summe.newsError = err.message || String(err);
    }

    if (faellig.length || summe.news || summe.newsError) console.log('Erinnerungen', JSON.stringify(summe));
    res.status(200).json(summe);
  } catch (err) {
    console.error('Erinnerungen fehlgeschlagen', err);
    res.status(500).json({ error: err.message || String(err) });
  }
}
