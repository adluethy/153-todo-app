# CLAUDE.md – 153 To-do & Zettel

Persönliche App für eine Person (Nutzer spricht Deutsch, Schweiz). Benutzerdoku: `LIESMICH.md`.
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
  Aktuell: `v=3`. Neue App-Dateien zusätzlich in `sw.js` → `FILES` eintragen.
- LIESMICH.md bei jeder Änderung am Funktionsumfang oder Stand nachführen (Nutzer wünscht das).

## Vom Nutzer festgelegt

- To-do: Kästchen 1 = erledigt (Text hellgrau), Kästchen 2 = löschen, **nur möglich wenn erledigt**.
  Kein „Rückgängig“ gewünscht. Sortieren per Ziehen. Optional Termin (Datum + Uhrzeit).
- Zettel: zwei Arten, `idee` (gelb) und `info` (blau). Verschiebbar, Grösse änderbar, mehrere offen.
  `×` legt den Zettel in die Ablage (`archived: true`), dort wieder öffnen oder endgültig löschen.
- Idee → To-do: Text wird Aufgabe, Zettel geht in die Ablage (`convertedAt` gesetzt).
- Handy (≤ 760 px): Umschalten To-do/Zettel unten, Zettel als Stapel.
- Keine Suche nötig.
- Geräte: 1 PC, 2 Laptops, 1 Android-Handy. Nur für eine Person.
- Hosting GitHub Pages + Datenbank Supabase bleiben (Entscheid 22.10.2026). Vercel geprüft und verworfen:
  Neon hat kein Login/RLS/Realtime eingebaut, Vercel-Cron im Gratis-Plan nur 1× pro Tag (±59 Min),
  untauglich für Push-Erinnerungen. Öffentliches Repo ist ok (Daten sind privat in Supabase).

## Konten und Adressen

- GitHub: `adluethy`, Repo https://github.com/adluethy/153-todo-app (öffentlich, Branch `main`).
- Online: https://adluethy.github.io/153-todo-app/ (GitHub Pages aus `main` / root).
- Supabase: Projekt `153-todo-app`, https://klwumomqtygqnxoomdbv.supabase.co (Konto über GitHub-Login).
  Publishable Key steht in `js/config.js` (öffentlich gedacht). Secret-/service_role-Schlüssel nie ins Repo.
- App-Login: E-Mail + Passwort, Benutzer im Supabase-Dashboard angelegt, Registrierung gesperrt.
  Claude gibt nie Passwörter ein: Für Tests mit Login meldet sich der Nutzer im Browser-Fenster selbst an.

## Daten

Lokal (store.js), localStorage-Schlüssel `todo-zettel.v1`:

```
{ version: 1,
  todos: [{ id (UUID), text, done, dueAt (ISO|null), order, createdAt, updatedAt }],
  notes: [{ id (UUID), type: 'idee'|'info', text, x, y (Anteil 0–1 der Fläche), w, h (px), z,
            archived, archivedAt, convertedAt, createdAt, updatedAt }] }
```

- `Store.updateX(id, patch, silent)`: `silent = true` speichert ohne Neuzeichnen (Tippen, Ziehen).
- Jede Änderung meldet `dirty(table, id, 'upsert'|'delete')` an sync.js (`Store._sync`).

Online (Supabase, `supabase/schema.sql`): Tabellen `todos`, `notes`, gleiche Felder in snake_case
(`order` → `sort_order`), `user_id` mit Default `auth.uid()`, RLS nur eigene Zeilen, Realtime aktiv.

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
3. Push-Erinnerungen für Termine: Web Push (VAPID) + Supabase Cron + Edge Function,
   neue Tabelle für Push-Abos.

## Testen

- `.claude/launch.json` startet `python -m http.server 8153`. Der Browser im Claude-Fenster
  kann `file://`-Seiten nicht bedienen, deshalb über den Server testen.
- Der Browser im Claude-Fenster kann keine Service Worker registrieren, das ist normal.
- Das Browser-Fenster ist oft schmaler als 760 px: Dann zeigt die App die Handy-Ansicht
  (Zettel nur im Reiter „Zettel“ sichtbar).
- Screenshots im Browser-Fenster sind manchmal abgeschnitten; Layout lieber per JavaScript prüfen.
