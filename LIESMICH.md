# 153 – To-do & Zettel

Persönliche App für eine To-do-Liste und Notizzettel (Ideen und Infos).
Ziel: läuft auf dem PC, den zwei Laptops und dem Android-Handy, mit denselben Daten überall.

## Starten

- **Am PC aus Dropbox:** Doppelklick auf `index.html`. Die App öffnet sich im Browser (Chrome oder Edge).
- **Online:** https://adluethy.github.io/153-todo-app/ (sobald GitHub Pages eingeschaltet ist)

## Als App installieren

- **Android-Handy:** Online-Adresse in Chrome öffnen → Menü `⋮` → „App installieren“
  (oder „Zum Startbildschirm hinzufügen“). Danach liegt das Symbol auf dem Startbildschirm.
- **PC / Laptop:** Online-Adresse in Chrome oder Edge öffnen → rechts in der Adressleiste
  auf das Installieren-Symbol klicken. Die App erscheint im Startmenü und lässt sich an die Taskleiste heften.

## Wichtig: Wo liegen die Daten? (Phase 1)

- Der **Programmcode** liegt hier im Dropbox-Ordner und ist damit auf allen PCs gleich.
- Die **Daten** (Aufgaben, Zettel) speichert der Browser auf dem jeweiligen Gerät, *nicht* in Dropbox.
  Am anderen PC startet die App deshalb leer.
- Daten mitnehmen: Menü `⋯` → „Daten sichern (Export)“ → die Datei in Dropbox legen →
  am anderen PC Menü `⋯` → „Sicherung laden (Import)“.
- Ab Phase 2 gleichen sich alle Geräte automatisch ab.

## Bedienung

**To-do**
- Aufgabe oben eintippen, Enter oder `+`. Mit dem Kalender-Knopf daneben gleich einen Termin setzen.
- 1. Kästchen = erledigt → Schrift wird hellgrau.
- 2. Kästchen = löschen → geht erst, wenn die Aufgabe erledigt ist. Die Aufgabe verschwindet.
- Auf den Text klicken, um ihn zu ändern (Enter speichert, Esc bricht ab).
- An den Punkten links ziehen, um die Reihenfolge zu ändern.
- Termin ändern oder entfernen: auf das Datum klicken (oder das Kalender-Symbol rechts).

**Zettel**
- „Neue Idee“ (gelb) oder „Neue Info“ (blau) legt einen Zettel an. Es können beliebig viele offen sein.
- Am farbigen Kopf ziehen = verschieben. Ecke unten rechts ziehen = Grösse ändern.
- `×` oben rechts = schliessen. Der Zettel kommt in die **Ablage** und kann dort wieder geöffnet
  oder endgültig gelöscht werden.
- Ideen-Zettel haben zusätzlich den Knopf „Als Aufgabe übernehmen“: Der Text wird zur Aufgabe,
  der Zettel kommt in die Ablage.

**Handy (schmaler Bildschirm)**
- Unten umschalten zwischen „To-do“ und „Zettel“.
- Die Zettel erscheinen als Stapel (neueste oben), ohne Verschieben und Grösse ändern.

## Konten

| Dienst | Konto | Wofür |
|---|---|---|
| GitHub | Benutzer `adluethy`, Repository https://github.com/adluethy/153-todo-app | Code ablegen und die App online stellen (GitHub Pages) |
| Supabase | Anmeldung über GitHub (`adluethy`), angelegt am 22.10.2026 | Online-Datenbank und Login |

Passwörter gehören nicht in diese Datei, sondern in den Passwort-Manager.

## Fahrplan

- [x] **Phase 1:** Prototyp mit allen Funktionen, Daten lokal im Browser
- [ ] **Phase 2:** Online-Datenbank (Supabase) mit Login, App über GitHub Pages online stellen,
      auf Handy und Laptops als App installieren
  - [x] Supabase-Konto angelegt (über GitHub `adluethy`)
  - [ ] Supabase-Projekt anlegen und Tabellen einrichten (`supabase/schema.sql`)
  - [ ] App mit der Datenbank verbinden
  - [x] GitHub-Repository angelegt, App installierbar gemacht (Symbol, Offline-Start)
  - [ ] GitHub Pages einschalten (Repository → Settings → Pages → Branch `main`, Ordner `/ (root)`)
  - [ ] Auf Handy und Laptops installieren
- [ ] **Phase 3:** Termine mit Push-Benachrichtigung aufs Handy

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seitengerüst |
| `css/style.css` | Gestaltung, inkl. Handy-Ansicht |
| `js/ui.js` | Icons und Kurzmeldungen |
| `js/store.js` | Datenspeicher (wird in Phase 2 auf Supabase umgestellt) |
| `js/todos.js` | To-do-Liste |
| `js/notes.js` | Zettel und Ablage |
| `js/app.js` | Ansicht wechseln, Menü, Export/Import |
| `supabase/schema.sql` | Tabellen für die Online-Datenbank (einmal im Supabase-Dashboard ausführen) |
| `manifest.webmanifest`, `sw.js`, `icons/` | Damit sich die App installieren lässt und ohne Internet startet |
| `.gitignore` | Was nicht auf GitHub soll (z.B. Daten-Sicherungen) |

## Git und Dropbox

Der Ordner ist ein Git-Repository und mit GitHub verbunden. Weil er in Dropbox liegt, gilt:
Änderungen immer nur von **einem** PC aus hochladen und vorher warten, bis Dropbox fertig synchronisiert hat.
Daten-Sicherungen (`todo-zettel-sicherung-*.json`) werden nie hochgeladen, weil das Repository öffentlich ist.
| `CLAUDE.md` | Hinweise für Claude, damit es am anderen PC nahtlos weitergeht |
