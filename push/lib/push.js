/* Gemeinsame Teile des Erinnerungs-Dienstes.
   Öffentliche Werte stehen hier; die geheimen kommen aus den Umgebungsvariablen in Vercel:
   SUPABASE_SECRET_KEY, VAPID_PRIVATE_KEY, CRON_SECRET (nie ins Repo). */
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export const APP_URL = 'https://adluethy.github.io/153-todo-app/';
export const SUPABASE_URL = 'https://klwumomqtygqnxoomdbv.supabase.co';
export const VAPID_PUBLIC_KEY = 'BKiL1U-S3_jrer5Tng-FMhCKBvirWgXJzeNlDMEo_5spNxnRLivNfDgpZhi-hl8cCd0-vzlRjrY0NrAY7rMgF4o';
const TZ = 'Europe/Zurich';

// Wer die App aufrufen darf (Test-Mitteilung)
const ORIGINS = ['https://adluethy.github.io', 'http://localhost:8153'];

export function admin() {
  if (!process.env.SUPABASE_SECRET_KEY) throw new Error('SUPABASE_SECRET_KEY fehlt');
  return createClient(SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let vapidBereit = false;
function vapid() {
  if (vapidBereit) return;
  if (!process.env.VAPID_PRIVATE_KEY) throw new Error('VAPID_PRIVATE_KEY fehlt');
  webpush.setVapidDetails(APP_URL, VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  vapidBereit = true;
}

/* Mitteilung an alle Geräte einer Person (nurNeues: nur Geräte mit eingeschaltetem
   Schalter «Neue Einträge melden»). Abgelaufene Geräte (404/410) werden gelöscht.
   Ergebnis: Anzahl Geräte, erfolgreich, fehlgeschlagen, davon vorübergehend (lohnt einen neuen Versuch). */
export async function sendTo(db, userId, message, send = webpush.sendNotification, nurNeues = false) {
  vapid();
  let query = db.from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);
  if (nurNeues) query = query.eq('news', true);
  const { data: subs, error } = await query;
  if (error) throw error;
  const result = { devices: subs.length, ok: 0, failed: 0, transient: 0 };
  for (const s of subs) {
    try {
      await send({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(message), {
        TTL: 6 * 3600, // höchstens 6 Std. zustellen, danach ist die Erinnerung zu alt
        urgency: 'high',
      });
      result.ok++;
      await db.from('push_subscriptions').update({ last_ok_at: new Date().toISOString() }).eq('id', s.id);
    } catch (err) {
      result.failed++;
      if (err.statusCode === 404 || err.statusCode === 410) {
        await db.from('push_subscriptions').delete().eq('id', s.id); // Gerät gibt es nicht mehr
      } else {
        result.transient++;
        console.error('Push fehlgeschlagen', s.endpoint.slice(0, 60), err.statusCode, err.body || err.message);
      }
    }
  }
  return result;
}

const tag = d => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

// "Heute 14:00", "Morgen 09:30" oder "Fr., 24.10. 14:00" (Schweizer Zeit)
export function wann(due, now = new Date()) {
  const zeit = new Intl.DateTimeFormat('de-CH', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(due);
  const morgen = new Date(now.getTime() + 24 * 3600 * 1000);
  let datum;
  if (tag(due) === tag(now)) datum = 'Heute';
  else if (tag(due) === tag(morgen)) datum = 'Morgen';
  else datum = new Intl.DateTimeFormat('de-CH', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'numeric' }).format(due);
  return `${datum} ${zeit}`;
}

export function erinnerung(r, now = new Date()) {
  return {
    title: r.text.length > 120 ? r.text.slice(0, 117) + '…' : r.text,
    body: 'Termin: ' + wann(new Date(r.due_at), now),
    tag: 'todo-' + r.todo_id,
    url: './',
  };
}

/* Neue Einträge (aus claim_new_entries) pro Person zu einer Mitteilung bündeln.
   Ein Eintrag:  «Gemmel: neue Aufgabe von Barbara» bzw. «Für dich: neue Idee von Barbara», darunter der Text.
   Mehrere:      «Barbara: 3 neue Einträge», darunter je eine Zeile. */
const ART = { aufgabe: 'Aufgabe', idee: 'Idee', info: 'Info' };
const ORT = { gemmel: 'Gemmel', dein: 'Für dich' };
const kurz = (t, n) => {
  const s = String(t || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
};

export function neuigkeiten(rows) {
  const proPerson = new Map();
  rows.forEach(r => {
    if (!proPerson.has(r.user_id)) proPerson.set(r.user_id, []);
    proPerson.get(r.user_id).push(r);
  });
  return [...proPerson].map(([userId, liste]) => {
    const erster = liste[0];
    if (liste.length === 1) {
      return {
        userId,
        message: {
          title: `${ORT[erster.ort] || 'Neu'}: neue ${ART[erster.kind] || 'Eintrag'} von ${erster.actor_name}`,
          body: kurz(erster.text, 140),
          tag: 'neu-' + erster.entry_id,
          url: './',
        },
      };
    }
    const namen = [...new Set(liste.map(r => r.actor_name))];
    const zeilen = liste.slice(0, 4).map(r => `${ORT[r.ort] || 'Neu'} · ${ART[r.kind] || 'Eintrag'}: ${kurz(r.text, 50)}`);
    if (liste.length > 4) zeilen.push(`… und ${liste.length - 4} weitere`);
    return {
      userId,
      message: {
        title: `${namen.length === 1 ? namen[0] + ': ' : ''}${liste.length} neue Einträge`,
        body: zeilen.join('\n'),
        tag: 'neu-' + erster.entry_id,
        url: './',
      },
    };
  });
}

export function cors(req, res) {
  const origin = req.headers.origin;
  if (ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
}
