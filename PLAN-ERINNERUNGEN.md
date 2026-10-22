# Plan Phase 3: Erinnerungen per Push

Stand 22.10.2026, mit Adrian besprochen. **Gebaut und getestet (v=6), noch nicht live**:
SQL mit PGlite geprüft (26 Fälle), Dienst lokal geprüft (16 Fälle) und auf Vercel hochgeladen
(https://153-todo-push.vercel.app). Was zum Livegang fehlt: siehe CLAUDE.md, Fahrplan Punkt 3.

## Entscheide

- **Medium:** Push-Mitteilungen (Web Push). Kein WhatsApp (Meta-Geschäftskonto, eigene Nummer,
  Vorlagen-Freigabe), keine SMS (laufende Kosten). Mail eventuell später als Tageszusammenfassung.
- **Versand:** Vercel Cron (Pro, jede Minute) ruft eine Vercel Function auf; sie liest die fälligen
  Erinnerungen aus Supabase und schickt sie mit `web-push`. App bleibt auf GitHub Pages,
  Datenbank bleibt Supabase.
- **Für wen:** Jede Aufgabe hat zwei Schalter **A** und **B**. Beim Erfassen ist die eigene Person
  eingeschaltet. Ist auch der andere Schalter an, gilt die Aufgabe für beide, und beide bekommen
  die Erinnerung. Mindestens ein Schalter bleibt immer an. Erfassen, Abhaken und Löschen bleiben
  für beide bei allen Aufgaben möglich.
- **Wann:** fest **1 Tag** und **2 Stunden** vor dem Termin (Liste `[1440, 120]` Minuten, an einer
  Stelle änderbar). Nur Aufgaben mit Termin, nicht erledigt.
- **Wohin:** an alle Geräte der Person, auf denen sie Erinnerungen eingeschaltet hat
  (pro Gerät im Menü ein- und ausschaltbar).

## Geklärt (22.10.2026)

1. Die Schalter A/B ersetzen das bisherige «A:» vor der Aufgabe. Wer erfasst hat, steht im Hinweis
   beim Darüberfahren.
2. Schalter auch im Eingabefeld oben (neben dem Kalender-Knopf).
3. Keine Ruhezeit in der Nacht; «Nicht stören» am Handy regelt das.

## Regeln für den Versand

- Eine Erinnerung geht nur raus, wenn ihr Zeitpunkt **nach** dem Setzen des Termins liegt.
  Wer heute um 20 Uhr einen Termin für morgen 9 Uhr setzt, bekommt nur die 2-Stunden-Erinnerung.
- Wird der Termin geändert, beginnt alles neu (bereits verschickte Erinnerungen zählen nicht mehr).
- Verpasste Erinnerungen (z.B. Störung bei Vercel) werden bis 6 Stunden später nachgeholt, danach
  verworfen.
- Wird jemand später per Schalter dazugenommen, bekommt er die noch kommenden Erinnerungen
  (und eine eben verpasste, wenn sie weniger als 6 Stunden zurückliegt).
- Jede Erinnerung pro Person und Zeitpunkt genau einmal (wird beim Abholen in der Datenbank
  vermerkt, auch wenn der Zeitplan einmal doppelt läuft).
- Text: Titel = Aufgabe, darunter z.B. «Morgen 14:00» bzw. «In 2 Std. · Heute 14:00».
  Antippen öffnet die App.

## Datenbank (supabase/schema.sql, ergänzen)

- `todos.assignees uuid[]` – für wen (Standard: wer erfasst hat). Bestehende Aufgaben bekommen
  `array[user_id]`.
- `todos.due_set_at timestamptz` – wann der Termin zuletzt gesetzt wurde (Trigger setzt ihn, wenn
  `due_at` sich ändert, und löscht dann die Versand-Vermerke dieser Aufgabe).
- Tabelle `push_subscriptions` (id, user_id, endpoint unique, p256dh, auth, geraet, created_at,
  last_ok_at); RLS: jede Person nur ihre eigenen Geräte.
- Tabelle `reminders_sent` (todo_id, user_id, offset_min, sent_at), eindeutig pro
  (todo_id, user_id, offset_min).
- Funktion `claim_due_reminders()` (nur für den Server-Schlüssel): sucht fällige Erinnerungen nach
  den Regeln oben, vermerkt sie in `reminders_sent` und gibt sie zurück (in einem Schritt, damit
  nichts doppelt geht).
- Vor dem Ausführen wieder mit PGlite prüfen (siehe CLAUDE.md, Testen).

## Server (Ordner `push/` im selben Repo, eigenes Vercel-Projekt)

- `push/api/erinnern.js`: vom Cron jede Minute; prüft `CRON_SECRET`, holt `claim_due_reminders()`,
  schickt pro Person an alle ihre Geräte; abgelaufene Geräte (Antwort 404/410) werden gelöscht.
- `push/api/test.js`: «Test-Mitteilung» aus der App; prüft das Login der Person, schickt an ihre
  Geräte. Erlaubt nur Aufrufe von adluethy.github.io (und localhost:8153 zum Testen).
- `push/vercel.json`: Cron `* * * * *` auf `/api/erinnern`, Region `fra1`.
- Vercel-Projekt `153-todo-push` (Team `mathefrosch`), Stammordner `push`. Hochgeladen wird per
  Vercel-CLI aus diesem Ordner, nicht über GitHub (so lösen App-Änderungen keinen Neubau aus).
- Umgebungsvariablen (trägt Adrian im Vercel-Dashboard ein, Claude gibt keine Schlüssel ein):
  `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
  `VAPID_SUBJECT` (mailto:…), `CRON_SECRET`. VAPID-Schlüssel und Cron-Geheimnis erzeugt ein
  Befehl im Terminal; sie kommen nie ins Repo.
- Der Code in `push/` ist öffentlich (wie die App), die Schlüssel nicht.

## App

- `config.js`: öffentlicher VAPID-Schlüssel und Adresse des Vercel-Dienstes.
- Aufgabenzeile: Schalter A/B (aktiv = farbig); Glocke beim Termin, wenn Erinnerungen laufen.
- Menü: «Erinnerungen auf diesem Gerät einschalten/ausschalten», «Test-Mitteilung senden».
  Erlaubnis nur per Knopfdruck (iPhone verlangt das). Auf dem iPhone ohne Home-Bildschirm
  stattdessen der Hinweis, die App zuerst über Safari hinzuzufügen.
- Beim Start: Ist die Erlaubnis da, aber das Gerät nicht mehr in der Datenbank, neu eintragen.
- Abmelden: Gerät aus `push_subscriptions` löschen.
- `sw.js`: Ereignisse `push` (Mitteilung zeigen) und `notificationclick` (App öffnen oder nach vorne holen).
- Version erhöhen, LIESMICH, CLAUDE.md und Barbaras Anleitung (Erinnerungen einschalten) nachführen.

## Was Adrian tun muss

1. Neues SQL im Supabase SQL Editor ausführen.
2. Im Vercel-Dashboard die Umgebungsvariablen eintragen (Anleitung kommt mit).
3. Auf jedem Gerät im Menü «Erinnerungen einschalten» und erlauben, dann «Test-Mitteilung senden».
4. Barbara dasselbe auf ihrem iPhone.

## Hinweise

- iPhone: Push nur, wenn die App über Safari auf dem Home-Bildschirm liegt (ab iOS 16.4).
  Die Schweiz ist von der EU-Einschränkung nicht betroffen.
- PC: Mitteilungen kommen nur, wenn Chrome/Edge im Hintergrund läuft (meist Standard).
- Vercel startet den Zeitplan nicht garantiert auf die Sekunde; eine Minute Verspätung ist möglich.
- Kosten: im Vercel-Pro-Guthaben enthalten (rund 43 000 kurze Aufrufe pro Monat).
