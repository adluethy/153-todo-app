# CLAUDE.md – 153 To-do & Zettel

App für zwei Personen mit gemeinsamen Listen: Adrian (Nutzer, spricht Deutsch, Schweiz) und seine
Frau Barbara (seit 22.10.2026). Benutzerdoku: `LIESMICH.md`.
Der Ordner liegt in Dropbox und wird an mehreren PCs bearbeitet.

## Konventionen

- Oberfläche und Doku auf Deutsch, Schweizer Schreibweise: **kein ß** (schliessen, Grösse).
- Kein Build-Schritt, kein npm: reines HTML/CSS/JavaScript.
  Einzige Ausnahme: der Erinnerungs-Dienst in `push/` (Node, ES-Module, npm-Pakete installiert Vercel
  beim Hochladen; **nie `npm install` im Dropbox-Ordner**, zum Testen nach Scratchpad kopieren).
- Klassische `<script>`-Tags, **keine ES-Module**: Die App muss per Doppelklick (`file://`) laufen.
- Module hängen sich an `window`: `APP_CONFIG` (config.js), `Icon`, `App.toast` (ui.js), `Store` (store.js),
  `Layers` (layers.js), `Notes` (notes.js), `Sync` (sync.js), `Push` (push.js).
  Reihenfolge der Scripts in `index.html` beachten (layers.js nach store.js, vor todos.js/notes.js).
- Kein Dunkelmodus (vom Nutzer nicht gewünscht).
- **Bei jeder Änderung an CSS/JS:** in `index.html` die Version `?v=N` bei *allen* CSS/JS-Links
  um eins erhöhen und in `sw.js` die `CACHE`-Version gleich setzen. Sonst mischt der Browser
  nach einem Update bis zu 10 Minuten alte und neue Dateien (GitHub Pages speichert 10 Min zwischen).
  Aktuell: `v=7`. Neue App-Dateien zusätzlich in `sw.js` → `FILES` eintragen.
- App-Icon (seit 22.10.2026, v=5): Mathefrosch (Favicon von mathefrosch.com) vor blauem und gelbem Zettel,
  vom Nutzer aus vier Entwürfen gewählt. Alle Dateien in `icons/` erzeugt `icon-entwuerfe/icon_bauen.py`
  (Ordner nur in Dropbox, per `.git/info/exclude` nicht auf GitHub). Nach neuem Icon Version erhöhen;
  iPhone übernimmt es erst nach Löschen und Neu-Hinzufügen der App.
- LIESMICH.md bei jeder Änderung am Funktionsumfang oder Stand nachführen (Nutzer wünscht das).

## Vom Nutzer festgelegt

- To-do: Kästchen 1 = erledigt (Text hellgrau), Kästchen 2 = löschen, **nur möglich wenn erledigt**.
  Kein „Rückgängig“ gewünscht. Sortieren per Ziehen. Optional Termin (Datum + Uhrzeit).
- Zettel: zwei Arten, `idee` (gelb) und `info` (blau). Verschiebbar, Grösse änderbar, mehrere offen.
  `×` legt den Zettel in die Ablage (`archived: true`), dort wieder öffnen oder endgültig löschen.
- Idee → To-do: Text wird Aufgabe, Zettel geht in die Ablage (`convertedAt` gesetzt).
- Handy (≤ 760 px): Umschalten To-do/Zettel unten, Zettel als Stapel.
- Keine Suche nötig.
- Geräte Adrian: 1 PC, 2 Laptops, 1 Android-Handy; dazu Barbaras Geräte.
- Zu zweit (22.10.2026): Beide sehen, erledigen, ändern und löschen alles, keine privaten Einträge.
  Ideen/Infos zeigen unten rechts den Namen.
- Schalter A/B (seit v=6): pro Aufgabe zwei runde Knöpfe = für wen sie gilt (`assignees`).
  Mindestens eine Person bleibt an. Wer erfasst hat, steht im Tooltip der Knöpfe.
- **Reiter (v=7, Entwurf vom Nutzer gewählt 22.10.2026, Bilder in `entwurf-reiter/`):** oben in der Kopfzeile
  je ein Reiter pro Person (Kürzel-Kreis + Name) und **„Gemmel“** (Name vom Nutzer, Kürzel „A B“) für beide;
  am Handy als eigene Zeile unter dem Titel. Beide sehen alle Reiter (ordnen, nicht privat).
  - Aufgaben: Reiter einer Person = Aufgaben mit ihr in `assignees` (auch gemeinsame); Gemmel = Aufgaben
    für alle Personen. Neue Aufgabe gilt für den Reiter (Person → `[sie]`, Gemmel → alle); die Schalter A/B
    im Eingabefeld sind mit Reitern ausgeblendet. A/B an der Aufgabe verschiebt sie zwischen Reitern
    (Meldung, wenn sie dabei aus dem Reiter verschwindet). Aufgaben ohne eingetragene Person → Gemmel.
  - Zettel: `space` = Person, null = Gemmel; jeder Reiter hat eigene Fläche und eigene Ablage.
    Bisherige Zettel → Gemmel. Knopf „Verschieben nach …“ (zwei Pfeile) im Zettelkopf.
  - Idee → Aufgabe: Aufgabe kommt in den Reiter der Idee (ersetzt „Person der Idee“); erfasst = Ideengeber.
  - Reihenfolge: eine gemeinsame; Ziehen im Reiter tauscht nur die Plätze der sichtbaren (`mergeOrder`).
  - Gewählter Reiter pro Gerät in localStorage `todo-zettel.layer` (`'G'` oder User-ID), Start: eigener.
  - Ohne Anmeldung oder mit weniger als zwei Personen: keine Reiter, alles sichtbar (wie früher).
- Erinnerungen (Phase 3, Entscheide 22.10.2026): Web Push, fest **1 Tag und 2 Std.** vor dem Termin, an alle
  Geräte der eingeschalteten Personen. Keine Ruhezeit in der Nacht. Kein WhatsApp/SMS. Plan: `PLAN-ERINNERUNGEN.md`.
- Hosting GitHub Pages + Datenbank Supabase bleiben vorerst (Entscheid 22.10.2026).
  Öffentliches Repo ist ok (Daten sind privat in Supabase).
- **Der Nutzer hat einen bezahlten Vercel-Account (Pro)** und möchte, dass dessen Möglichkeiten bei
  künftigen Vorschlägen berücksichtigt werden. Vorbild: mathefrosch.com (`Dropbox\150-Mathefrosch-2026`,
  Next.js 16 auf Vercel, Neon-Postgres über Vercel Storage, Vercel Blob, Region `fra1`).
  Mit Pro verfügbar: Cron bis minütlich, Serverless Functions, Deployments aus privaten Repos, Env-Variablen.
  - Für Phase 3 (Push) gewählt: **Vercel Cron + Function** mit `web-push`, liest fällige Termine mit dem
    Supabase-Secret-Key aus einer Vercel-Env-Variable (Projekt `153-todo-push`, siehe Konten).
  - Datenbank bleibt Supabase: Login, RLS und Realtime sind dort eingebaut; Neon hätte das nicht.
  - Hosting könnte zu Vercel wechseln, falls der Code privat werden soll.
  - Lehre aus Mathefrosch: `next dev` nie im Dropbox-Ordner laufen lassen (Datei-Sperren unter Windows).

## Konten und Adressen

- GitHub: `adluethy`, Repo https://github.com/adluethy/153-todo-app (öffentlich, Branch `main`).
- Online: https://adluethy.github.io/153-todo-app/ (GitHub Pages aus `main` / root).
- Supabase: Projekt `153-todo-app`, https://klwumomqtygqnxoomdbv.supabase.co (Konto über GitHub-Login).
  Publishable Key steht in `js/config.js` (öffentlich gedacht). Secret-/service_role-Schlüssel nie ins Repo.
- App-Login: E-Mail + Passwort, je ein Benutzer pro Person im Supabase-Dashboard angelegt,
  Registrierung gesperrt. Mitmachen darf nur, wer zusätzlich im SQL Editor eingetragen ist:
  `select add_person('<E-Mail>', '<Name>');` (Kürzel = erster Buchstabe). E-Mails nie ins Repo (öffentlich).
  Claude gibt nie Passwörter ein: Für Tests mit Login meldet sich der Nutzer im Browser-Fenster selbst an.
- Vercel: Projekt `153-todo-push` im Team `mathefrosch`, https://153-todo-push.vercel.app, Stammordner `push/`
  (verknüpft per `push/.vercel/`, nicht im Repo). Hochladen: im Ordner `push` →
  `& "$env:APPDATA\npm\vercel.cmd" deploy --prod --yes` (nicht mit GitHub verbunden, App-Pushes lösen nichts aus).
  `vercel link` legt `push/.env.local` mit einem kurzlebigen Token an: löschen, nie ins Repo.
- Geheime Werte nur als Umgebungsvariablen in Vercel (Production): `SUPABASE_SECRET_KEY`, `VAPID_PRIVATE_KEY`,
  `CRON_SECRET`; Claude trägt sie nie selbst ein (Nutzer im Dashboard). Kopie von VAPID_PRIVATE_KEY und
  CRON_SECRET: `C:\Users\Adrian\.todo_push_schluessel.txt` (ausserhalb von Dropbox, nie lesen/zeigen).
  Öffentlicher VAPID-Schlüssel steht in `js/config.js` und `push/lib/push.js` (müssen gleich sein).
  Neues Schlüsselpaar → alle Geräte melden sich beim nächsten Öffnen selbst neu an (push.js prüft den Schlüssel).

## Daten

Lokal (store.js), localStorage-Schlüssel `todo-zettel.v1`:

```
{ version: 1,
  todos: [{ id (UUID), userId, assignees ([userId…]), text, done, dueAt (ISO|null), order, createdAt, updatedAt }],
  notes: [{ id (UUID), userId, space (userId|null = Gemmel), type: 'idee'|'info', text, x, y (Anteil 0–1 der Fläche), w, h (px), z,
            archived, archivedAt, convertedAt, createdAt, updatedAt }] }
```

- `userId` = wer den Eintrag erfasst hat (Supabase-User-ID; `null`, solange nie angemeldet).
- Personen: localStorage `todo-zettel.people.v1` = `[{ userId, name, initial }]`, Zwischenspeicher der
  Tabelle `people`. `Store.person(userId)` liefert Name und Kürzel oder `null` (dann wird nichts angezeigt).
  Neue Personenliste meldet das Thema `'people'` (todos.js und notes.js zeichnen neu).
- `Store.updateX(id, patch, silent)`: `silent = true` speichert ohne Neuzeichnen (Tippen, Ziehen).
- Jede Änderung meldet `dirty(table, id, 'upsert'|'delete')` an sync.js (`Store._sync`).

Online (Supabase, `supabase/schema.sql`, darf mehrmals laufen): Tabellen `todos`, `notes`, gleiche Felder
in snake_case (`order` → `sort_order`, `userId` → `user_id` mit Default `auth.uid()`), Realtime aktiv.
- `notes.space uuid` (Reiter, seit v=7): `references auth.users on delete set null`, null = Gemmel.
  Alte App-Versionen schicken das Feld nicht; der Upsert lässt es dann unverändert (lokal geprüft).
- `people (user_id, name, initial)`: wer mitmacht. Nur per `add_person()` im SQL Editor änderbar
  (security definer, Ausführen für anon/authenticated entzogen).
- RLS (`Gemeinsame Aufgaben`/`Gemeinsame Zettel`): `user_id = auth.uid() or is_member()`, d.h. eigene
  Zeilen immer, alle Zeilen für eingetragene Personen. `people` lesen nur Eingetragene.
- sync.js schickt `user_id` bei jedem Upsert mit (nie `null`): PostgREST-Upsert mit uneinheitlichen
  Feldern würde sonst Fehler geben oder die Person überschreiben. Ebenso `assignees` (leer → `[user_id]`).
  `same()` vergleicht Listen per JSON.
- Erinnerungen: `todos.assignees uuid[]`, `todos.due_set_at` (setzt nur der Trigger `todos_before_write`:
  beim Ändern von `due_at` neu und Versand-Vermerke löschen; App schickt das Feld nie).
  `push_subscriptions` (eigene Geräte, RLS), eintragen per RPC `save_push_subscription()` (übernimmt
  ein Gerät, das vorher jemand anderem gehörte). `reminders_sent` (ohne Policies, nur Dienst).
  `claim_due_reminders()` nur für `service_role`: Abstände `(1440, 120)` Minuten stehen dort; Regel:
  Zeitpunkt ≥ `due_set_at`, ≤ jetzt, > jetzt − 6 Std., nur Mitglieder aus `people`, jede genau einmal.
- Dienst `push/`: `api/erinnern.js` (Cron jede Minute, `CRON_SECRET`; bei nur vorübergehendem Fehler
  Vermerk zurück → nächste Minute neu), `api/test.js` (Test-Mitteilung, prüft Supabase-Token, CORS nur
  github.io und localhost:8153), `lib/push.js` (Versand, Texte in Schweizer Zeit, 404/410 → Gerät löschen).
- push.js (App): Menü «Erinnerungen ein-/ausschalten», «Test-Mitteilung senden»; localStorage
  `todo-zettel.push` = `'on'`. Erlaubnis nur im Klick (iPhone). Abmelden trägt das Gerät vorher aus.
  `sw.js` zeigt Mitteilungen (`push`) und öffnet die App (`notificationclick`); Symbol `icons/badge-96.png`.

Abgleich (sync.js):
- Warteschlange `todo-zettel.outbox.v1` (je Eintrag `table:id` → op + Versionszähler), hochgeladen
  gebündelt per `upsert` / `delete().in()`, bei Fehler alle 15 s neu.
- Holen (`pull`): ganze Tabellen; Einträge mit offener lokaler Änderung gewinnen, sonst gilt die Datenbank.
- Live: Realtime `postgres_changes`; ausserdem `pull` beim Zurückkehren in die App und bei `online`.
- Erstes Anmelden auf einem Gerät (`todo-zettel.user` fehlt): alle lokalen Einträge werden hochgeladen.
- Abmelden nur lokal (`signOut({ scope: 'local' })`), löscht die lokale Kopie.
- Supabase-JS per CDN mit fester Version und SRI-Hash (`@supabase/supabase-js@2.117.2`);
  `sw.js` speichert die Bibliothek für den Offline-Start.

## Fahrplan

1. **Erledigt:** Prototyp, Daten lokal.
2. **Fast erledigt:** Supabase-Abgleich, GitHub Pages, PWA (getestet am 22.10.2026).
   Offen: Installation auf Handy/Laptops durch den Nutzer.
   - Zu zweit (v=4, 22.10.2026): Code online, `schema.sql` ausgeführt (vorher lokal mit PGlite
     geprüft), Adrian per `add_person` eingetragen. Offen: Barbaras Benutzer anlegen und eintragen,
     Test mit zwei Anmeldungen.
3. Push-Erinnerungen für Termine – **live seit 22.10.2026** (v=6, Commit d4dc0e1). Plan und Entscheide:
   `PLAN-ERINNERUNGEN.md`. `schema.sql` ausgeführt, Geheimwerte in Vercel, Cron antwortet seit 13:05 mit 200
   (`vercel logs --project 153-todo-push --since 15m --json`). Lehre: Env-Variablen gelten erst nach neuem
   Hochladen des Dienstes; App mit neuen Spalten erst nach dem SQL pushen.
   Zustellung bestätigt: Adrians Android-Handy und PC (13:28 echte Erinnerung an 2 Geräte, ok).
   Am PC kam erst nichts, weil die offene App noch v=5 hatte (GitHub Pages hält index.html bis 10 Min.);
   nach F5 ging es. Barbaras Konto laut Adrian angelegt
   (22.10.2026; Kontrolle: Schalter B erscheint in der App). Offen: Laptops, Barbaras iPhone.
4. **Reiter Adrian/Barbara/Gemmel (v=7):** gebaut und lokal getestet am 22.10.2026 (Filter, neue Einträge,
   A/B-Umschalten, Idee → Aufgabe, Verschieben-Menü, Sortieren, Handy-Ansicht, ohne Anmeldung).
   SQL-Teil `notes.space` mit PGlite geprüft (zweimal ausführbar, alte App-Version harmlos).
   `schema.sql` vom Nutzer ausgeführt (Feld per REST geprüft), **online seit 22.10.2026** (Commit 009befb),
   Online-Version lädt v=7 ohne Fehler. Lehre bestätigt: neue Spalten erst in Supabase, dann pushen.
   Barbaras Anleitung auf v=7 nachgeführt (5 S., neue Seite 4 «Drei Reiter», Bilder mit Reiter Barbara).
   Test mit echter Anmeldung: Nutzer bestätigt „funktioniert bestens“ (22.10.2026). **Erledigt.**

## Testen

- `.claude/launch.json` startet `python -m http.server 8153`. Der Browser im Claude-Fenster
  kann `file://`-Seiten nicht bedienen, deshalb über den Server testen.
- Der Browser im Claude-Fenster kann keine Service Worker registrieren, das ist normal.
- Das Browser-Fenster ist oft schmaler als 760 px: Dann zeigt die App die Handy-Ansicht
  (Zettel nur im Reiter „Zettel“ sichtbar).
- Screenshots im Browser-Fenster sind manchmal abgeschnitten; Layout lieber per JavaScript prüfen.
- Im Claude-Browser ist `127.0.0.1:8153` evtl. mit echtem Konto angemeldet (echte Daten!). Für Tests mit
  erfundenen Daten `localhost:8153` nehmen (eigener Speicher, keine Sitzung; vorher `localStorage` prüfen).
- Ohne Login zeigt die App keine Schalter A/B und keine Reiter. Zum Prüfen der Anzeige `todo-zettel.people.v1`,
  `todo-zettel.user` und `userId`/`assignees` in `todo-zettel.v1` per JavaScript setzen und neu laden.
  Nach Änderungen an JS/CSS die Dateien per `fetch(url, { cache: 'reload' })` frisch holen, der
  Browser hält sonst die alte Fassung mit derselben `?v=N` fest.
- Push lässt sich im Claude-Browser nicht testen (kein Service Worker); das Menü erscheint dort nicht.
  Den Dienst lokal prüfen: `push/` ins Scratchpad kopieren, `npm install`, Datenbank nachbauen und
  `webpush.generateRequestDetails` + `http_ece.decrypt` statt echtem Versand (Testmuster 22.10.2026).
- Barbaras Anleitung (`anleitung/`, nur Dropbox): Ablauf in `anleitung/_werkzeug/LIESMICH.txt`
  (puppeteer-core im Scratchpad, Pfade über den Benutzerordner, also an beiden PCs gleich).
  Puppeteer kann Edge an diesem PC nicht selbst starten („Code: 0“); `edge.mjs` startet Edge dann mit
  festem Port und verbindet sich. Screenshots mit `clip` schliessen offene Menüs (kurze Grössenänderung
  → resize) und verrutschen bei dreifacher Auflösung: ganzes Bild aufnehmen und im Browser zuschneiden.
  Die App-Änderung, die Barbara sieht, immer auch in der Anleitung nachführen.
- SQL-Änderungen vor dem Ausführen lokal prüfen: `@electric-sql/pglite` per npm im Scratchpad
  (nicht im Projekt), Supabase nachbauen (Schema `auth` mit `users` und `uid()` aus
  `request.jwt.claim.sub`, Rollen anon/authenticated, Default-Rechte auf Funktionen, Publication
  `supabase_realtime`), dann mit `set role authenticated` die Policies durchspielen.
