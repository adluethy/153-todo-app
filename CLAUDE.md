# CLAUDE.md – 153 To-do & Zettel

Persönliche App für eine Person (Nutzer spricht Deutsch, Schweiz). Benutzerdoku: `LIESMICH.md`.
Der Ordner liegt in Dropbox und wird an mehreren PCs bearbeitet.

## Konventionen

- Oberfläche und Doku auf Deutsch, Schweizer Schreibweise: **kein ß** (schliessen, Grösse).
- Kein Build-Schritt, kein npm: reines HTML/CSS/JavaScript.
- Klassische `<script>`-Tags, **keine ES-Module**: Die App muss per Doppelklick (`file://`) laufen.
- Module hängen sich an `window`: `Icon`, `App.toast` (ui.js), `Store` (store.js), `Notes` (notes.js).
- Kein Dunkelmodus (vom Nutzer nicht gewünscht).

## Vom Nutzer festgelegt

- To-do: Kästchen 1 = erledigt (Text hellgrau), Kästchen 2 = löschen, **nur möglich wenn erledigt**.
  Kein „Rückgängig“ gewünscht. Sortieren per Ziehen. Optional Termin (Datum + Uhrzeit).
- Zettel: zwei Arten, `idee` (gelb) und `info` (blau). Verschiebbar, Grösse änderbar, mehrere offen.
  `×` legt den Zettel in die Ablage (`archived: true`), dort wieder öffnen oder endgültig löschen.
- Idee → To-do: Text wird Aufgabe, Zettel geht in die Ablage (`convertedAt` gesetzt).
- Handy (≤ 760 px): Umschalten To-do/Zettel unten, Zettel als Stapel.
- Keine Suche nötig.
- Geräte: 1 PC, 2 Laptops, 1 Android-Handy. Nur für eine Person.

## Daten (store.js)

localStorage-Schlüssel `todo-zettel.v1`:

```
{ version: 1,
  todos: [{ id, text, done, dueAt (ISO|null), order, createdAt, updatedAt }],
  notes: [{ id, type: 'idee'|'info', text, x, y (Anteil 0–1 der Fläche), w, h (px), z,
            archived, archivedAt, convertedAt, createdAt, updatedAt }] }
```

`Store.updateX(id, patch, silent)`: `silent = true` speichert ohne Neuzeichnen (Tippen, Ziehen).

## Fahrplan

1. **Erledigt:** Prototyp, Daten lokal.
2. **In Arbeit:** Supabase (Datenbank + Login, Region Europa), nur `store.js` umbauen.
   Hosting über GitHub Pages. PWA: `manifest.webmanifest`, Service Worker, Icons.
   - GitHub-Benutzer: `adluethy`. Supabase-Konto am 22.10.2026 angelegt (Login über GitHub).
   - Tabellen: `supabase/schema.sql` (Spalten in snake_case, Zugriff per RLS nur auf eigene Zeilen).
   - Login per E-Mail + Passwort, Nutzer im Dashboard angelegt, öffentliche Registrierung aus.
   - Git-Repository: https://github.com/adluethy/153-todo-app (öffentlich, Branch `main`).
     Online: https://adluethy.github.io/153-todo-app/ (GitHub Pages, vom Nutzer einzuschalten).
     Repo liegt in Dropbox: nie gleichzeitig von zwei PCs committen. Keine persönlichen Daten committen.
   - PWA: `manifest.webmanifest`, `sw.js` (Netz zuerst, offline aus Cache, nur gleiche Herkunft),
     Icons in `icons/` (erzeugt mit Pillow). Neue App-Dateien in `sw.js` → `FILES` eintragen.
     Der Browser im Claude-Fenster kann keine Service Worker registrieren, das ist normal.
   - Supabase-JS per CDN, Version fest angeben (z.B. `@supabase/supabase-js@2.117.2`).
3. Push-Erinnerungen für Termine: Web Push (VAPID) + Supabase Cron + Edge Function.

## Testen

`.claude/launch.json` startet `python -m http.server 8153`. Der Browser im Claude-Fenster
kann `file://`-Seiten nicht bedienen, deshalb über den Server testen.
