# CLAUDE.md – 153 To-do & Zettel

App für zwei Personen mit gemeinsamen Listen: Adrian (Nutzer, spricht Deutsch, Schweiz) und seine
Frau Barbara (seit 22.10.2026). Benutzerdoku: `LIESMICH.md`.
Der Ordner liegt in Dropbox und wird an mehreren PCs bearbeitet.

## Konventionen

- Oberfläche und Doku auf Deutsch, Schweizer Schreibweise: **kein ß** (schliessen, Grösse).
- Kein Build-Schritt, kein npm: reines HTML/CSS/JavaScript.
- Klassische `<script>`-Tags, **keine ES-Module**: Die App muss per Doppelklick (`file://`) laufen.
- Module hängen sich an `window`: `APP_CONFIG` (config.js), `Icon`, `App.toast` (ui.js), `Store` (store.js),
  `Notes` (notes.js), `Sync` (sync.js). Reihenfolge der Scripts in `index.html` beachten.
- Kein Dunkelmodus (vom Nutzer nicht gewünscht).
- **Bei jeder Änderung an CSS/JS:** in `index.html` die Version `?v=N` bei *allen* CSS/JS-Links
  um eins erhöhen und in `sw.js` die `CACHE`-Version gleich setzen. Sonst mischt der Browser
  nach einem Update bis zu 10 Minuten alte und neue Dateien (GitHub Pages speichert 10 Min zwischen).
  Aktuell: `v=4`. Neue App-Dateien zusätzlich in `sw.js` → `FILES` eintragen.
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
  Aufgaben zeigen vorne das Kürzel der Person, die sie **erfasst** hat (`A:`, `B:`; fest, nicht
  umschaltbar, heisst nicht „zuständig“). Ideen/Infos zeigen unten rechts den Namen.
  Idee → Aufgabe: Die Aufgabe übernimmt die Person der Idee.
- Hosting GitHub Pages + Datenbank Supabase bleiben vorerst (Entscheid 22.10.2026).
  Öffentliches Repo ist ok (Daten sind privat in Supabase).
- **Der Nutzer hat einen bezahlten Vercel-Account (Pro)** und möchte, dass dessen Möglichkeiten bei
  künftigen Vorschlägen berücksichtigt werden. Vorbild: mathefrosch.com (`Dropbox\150-Mathefrosch-2026`,
  Next.js 16 auf Vercel, Neon-Postgres über Vercel Storage, Vercel Blob, Region `fra1`).
  Mit Pro verfügbar: Cron bis minütlich, Serverless Functions, Deployments aus privaten Repos, Env-Variablen.
  - Für Phase 3 (Push) ist daher **Vercel Cron + Function** eine echte Option neben Supabase Cron + Edge Function
    (z.B. Function mit `web-push`, liest fällige Termine mit dem Supabase-Secret-Key aus einer Vercel-Env-Variable).
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

## Daten

Lokal (store.js), localStorage-Schlüssel `todo-zettel.v1`:

```
{ version: 1,
  todos: [{ id (UUID), userId, text, done, dueAt (ISO|null), order, createdAt, updatedAt }],
  notes: [{ id (UUID), userId, type: 'idee'|'info', text, x, y (Anteil 0–1 der Fläche), w, h (px), z,
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
- `people (user_id, name, initial)`: wer mitmacht. Nur per `add_person()` im SQL Editor änderbar
  (security definer, Ausführen für anon/authenticated entzogen).
- RLS (`Gemeinsame Aufgaben`/`Gemeinsame Zettel`): `user_id = auth.uid() or is_member()`, d.h. eigene
  Zeilen immer, alle Zeilen für eingetragene Personen. `people` lesen nur Eingetragene.
- sync.js schickt `user_id` bei jedem Upsert mit (nie `null`): PostgREST-Upsert mit uneinheitlichen
  Feldern würde sonst Fehler geben oder die Person überschreiben.

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
3. Push-Erinnerungen für Termine: Web Push (VAPID), neue Tabelle für Push-Abos.
   Versand entweder Supabase Cron + Edge Function oder Vercel Cron + Function (Nutzer hat Vercel Pro);
   vor dem Bauen mit dem Nutzer entscheiden. Ebenfalls klären: wer bekommt die Erinnerung
   (beide, oder nur wer die Aufgabe erfasst hat)?

## Testen

- `.claude/launch.json` startet `python -m http.server 8153`. Der Browser im Claude-Fenster
  kann `file://`-Seiten nicht bedienen, deshalb über den Server testen.
- Der Browser im Claude-Fenster kann keine Service Worker registrieren, das ist normal.
- Das Browser-Fenster ist oft schmaler als 760 px: Dann zeigt die App die Handy-Ansicht
  (Zettel nur im Reiter „Zettel“ sichtbar).
- Screenshots im Browser-Fenster sind manchmal abgeschnitten; Layout lieber per JavaScript prüfen.
- Ohne Login zeigt die App keine Kürzel. Zum Prüfen der Anzeige `todo-zettel.people.v1` und
  `userId` in `todo-zettel.v1` per JavaScript setzen und neu laden.
- SQL-Änderungen vor dem Ausführen lokal prüfen: `@electric-sql/pglite` per npm im Scratchpad
  (nicht im Projekt), Supabase nachbauen (Schema `auth` mit `users` und `uid()` aus
  `request.jwt.claim.sub`, Rollen anon/authenticated, Default-Rechte auf Funktionen, Publication
  `supabase_realtime`), dann mit `set role authenticated` die Policies durchspielen.
