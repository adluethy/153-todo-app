# 153 – To-do & Zettel

App für eine To-do-Liste und Notizzettel (Ideen und Infos).
Läuft auf dem PC, den zwei Laptops und dem Android-Handy, mit denselben Daten überall.
Adrian und Barbara nutzen die Listen gemeinsam: Beide sehen, erledigen, ändern und löschen alles.

## Starten

- **Online (empfohlen):** https://adluethy.github.io/153-todo-app/
  Verknüpfung zum Doppelklicken: `To-do & Zettel (online).url` hier im Ordner.
- **Am PC aus Dropbox:** Doppelklick auf `index.html`. Die App öffnet sich im Browser (Chrome oder Edge).

Beim ersten Start auf jedem Gerät (und in jedem Browser) einmal anmelden. Danach bleibst du angemeldet.

## Als App installieren

- **Android-Handy:** Online-Adresse in Chrome öffnen → Menü `⋮` → „App installieren“
  (oder „Zum Startbildschirm hinzufügen“). Danach liegt das Symbol auf dem Startbildschirm.
- **PC / Laptop:** Online-Adresse in Chrome oder Edge öffnen → rechts in der Adressleiste
  auf das Installieren-Symbol klicken. Die App erscheint im Startmenü und lässt sich an die Taskleiste heften.

## Wo liegen die Daten?

- **Online** in der Supabase-Datenbank (Projekt `153-todo-app`). Nur mit euren beiden Logins zugänglich.
- **Zusätzlich auf jedem Gerät** als Kopie. Darum funktioniert die App auch ohne Internet;
  Änderungen werden hochgeladen, sobald wieder Internet da ist.
- Oben rechts zeigt die App den Stand:
  - **Synchron**: alles ist online gespeichert
  - **Speichert …**: Änderungen werden gerade hochgeladen
  - **Offline**: kein Internet, Änderungen warten auf dem Gerät
  - **Nur lokal**: nicht angemeldet (antippen zum Anmelden)
  - **Sync-Fehler**: antippen, um es nochmals zu versuchen
- Eine zusätzliche Sicherung als Datei: Menü `⋯` → „Daten sichern (Export)“.
  „Sicherung laden (Import)“ ersetzt alle Daten, auch Barbaras Einträge und auf den anderen Geräten.
- Der **Programmcode** liegt hier im Dropbox-Ordner und auf GitHub.

## Bedienung

**Reiter Adrian, Barbara und Gemmel** (oben in der Kopfzeile, am Handy unter dem Titel)
- Jede Person hat ihren Reiter, dazu **Gemmel** für beide. Beide sehen alle drei Reiter.
- **Aufgaben:** Im Reiter Adrian stehen alle Aufgaben mit Schalter A, also auch die gemeinsamen;
  bei Barbara alle mit B; in Gemmel nur die Aufgaben für beide.
- Neue Aufgaben gehören zum gewählten Reiter: bei Adrian nur A, in Gemmel A und B.
  So kann man auch der anderen Person eine Aufgabe in ihren Reiter legen.
- **Zettel** liegen in genau einem Reiter: Jeder Reiter hat eigene Ideen, Infos und eine eigene Ablage.
  Umziehen: am Zettel der Knopf mit den zwei Pfeilen → „Verschieben nach …“.
  Die Zettel von vor den Reitern liegen in Gemmel.
- Die App merkt sich auf jedem Gerät den zuletzt gewählten Reiter (beim ersten Mal: den eigenen).

**To-do**
- Aufgabe oben eintippen, Enter oder `+`. Mit dem Kalender-Knopf daneben gleich einen Termin setzen.
- Vor jeder Aufgabe stehen zwei runde Schalter **A** (Adrian) und **B** (Barbara): Blau = die Aufgabe gilt
  für diese Person, und sie bekommt die Erinnerungen. Einer bleibt immer an.
- Mit den Schaltern wandert eine Aufgabe zwischen den Reitern: B dazuschalten → gemeinsam (auch in Gemmel);
  A ausschalten → sie liegt nur noch bei Barbara.
- Für wen eine neue Aufgabe gilt, bestimmt der gewählte Reiter (im Eingabefeld steht „für Adrian“ bzw. „für beide“).
- Wer eine Aufgabe erfasst hat, zeigt der Hinweis beim Darüberfahren mit der Maus.
  Abhaken, ändern und löschen können beide alles.
- 1. Kästchen = erledigt → Schrift wird hellgrau.
- 2. Kästchen = löschen → geht erst, wenn die Aufgabe erledigt ist. Die Aufgabe verschwindet.
- Auf den Text klicken, um ihn zu ändern (Enter speichert, Esc bricht ab).
- An den Punkten links ziehen, um die Reihenfolge zu ändern. Die Reihenfolge ist für alle Reiter gleich;
  Aufgaben, die im gewählten Reiter nicht zu sehen sind, bleiben an ihrem Platz.
- Termin ändern oder entfernen: auf das Datum klicken (oder das Kalender-Symbol rechts).

**Zettel**
- „Neue Idee“ (gelb) oder „Neue Info“ (blau) legt einen Zettel an. Es können beliebig viele offen sein.
- Unten rechts steht, wer den Zettel geschrieben hat.
- Zettel und ihre Plätze sind für beide gleich: Wer am PC einen Zettel verschiebt, verschiebt ihn auch beim anderen.
- Am farbigen Kopf ziehen = verschieben. Ecke unten rechts ziehen = Grösse ändern.
- `×` oben rechts = schliessen. Der Zettel kommt in die **Ablage** und kann dort wieder geöffnet
  oder endgültig gelöscht werden.
- Ideen-Zettel haben zusätzlich den Knopf „Als Aufgabe übernehmen“: Der Text wird zur Aufgabe,
  der Zettel kommt in die Ablage. Die Aufgabe kommt in den Reiter der Idee (Idee in Gemmel → Aufgabe für beide).

**Handy (schmaler Bildschirm)**
- Unten umschalten zwischen „To-do“ und „Zettel“.
- Die Zettel erscheinen als Stapel (neueste oben), ohne Verschieben und Grösse ändern.

**Abmelden:** Menü `⋯` → „Abmelden“. Meldet nur dieses Gerät ab und löscht dort die lokale Kopie.

## Erinnerungen

- Für jede Aufgabe mit Termin kommt eine Mitteilung **1 Tag** und **2 Stunden** vor dem Termin,
  an die Personen, deren Schalter (A/B) eingeschaltet ist. Antippen öffnet die App.
- Erledigte Aufgaben erinnern nicht mehr. Wird der Termin verschoben, richten sich die Erinnerungen
  nach dem neuen Termin. Wer einen Termin kurzfristig setzt, bekommt nur die Erinnerungen, die noch
  in der Zukunft liegen (heute Abend für morgen früh: nur die 2-Stunden-Erinnerung).
- Eine kleine Glocke beim Datum zeigt, dass noch Erinnerungen folgen.
- **Einschalten, auf jedem Gerät einzeln:** Menü `⋯` → „Erinnerungen einschalten“ → Mitteilungen erlauben.
  Danach „Test-Mitteilung senden“: Sie kommt nach wenigen Sekunden auf allen eigenen Geräten an.
  Ausschalten im selben Menü.
- **iPhone:** geht nur, wenn die App über Safari auf dem Home-Bildschirm liegt und von dort geöffnet wird.
- **PC/Laptop:** Mitteilungen kommen, solange Chrome bzw. Edge im Hintergrund läuft (Standard).
- **Fehlt der Menüpunkt** oder fehlen die Schalter A/B nach einer neuen Version: Die App läuft noch in der
  alten Fassung. Neu laden (F5) bzw. App schliessen und wieder öffnen; GitHub liefert eine neue Version
  bis zu 10 Minuten verzögert aus.
- «Nicht stören» bzw. Fokus-Modi am Handy halten Mitteilungen zurück; eine Ruhezeit in der Nacht gibt es nicht.
- Verschickt werden die Erinnerungen von einem kleinen Dienst auf Vercel, der jede Minute nachschaut
  (Ordner `push/`). Fällt er einmal aus, holt er Verpasstes bis 6 Stunden später nach.

**Neue Einträge melden**
- Legt die andere Person etwas **in den Gemmel** oder **in deinen Reiter** (eine Aufgabe oder einen Zettel),
  kommt eine Mitteilung, z.B. «Gemmel: neue Aufgabe von Barbara» oder «Für dich: neue Idee von Barbara».
  Auch wenn sie einen Eintrag nachträglich dorthin verschiebt.
- Was sie in ihrem eigenen Reiter notiert, wird nicht gemeldet. Wer etwas erfasst, bekommt selbst keine Mitteilung.
- Zettel werden gemeldet, sobald Text drin steht und eine Minute lang nichts mehr geändert wurde.
  Mehrere neue Einträge kommen zusammen in einer Mitteilung («Barbara: 3 neue Einträge»).
- Ein- und ausschalten pro Gerät: Menü `⋯` → „Neue Einträge melden“ (rechts steht „an“ oder „aus“).
  Der Punkt erscheint, sobald auf dem Gerät die Erinnerungen eingeschaltet sind.

## Konten

| Dienst | Konto | Wofür |
|---|---|---|
| GitHub | Benutzer `adluethy`, Repository https://github.com/adluethy/153-todo-app | Code ablegen und die App online stellen (GitHub Pages) |
| Supabase | Anmeldung über GitHub (`adluethy`), angelegt am 22.10.2026, Projekt `153-todo-app` | Online-Datenbank und Login |
| App-Login | je eine Anmeldung für Adrian und Barbara (E-Mail und Passwort), angelegt in Supabase unter Authentication → Users | Anmelden in der App auf allen Geräten |
| Vercel | Team `mathefrosch` (Pro), Projekt `153-todo-push`, https://153-todo-push.vercel.app | Verschickt die Erinnerungen (jede Minute) |

Die drei geheimen Werte des Erinnerungs-Dienstes (`SUPABASE_SECRET_KEY`, `VAPID_PRIVATE_KEY`,
`CRON_SECRET`) stehen nur in Vercel unter Settings → Environment Variables. Eine Kopie der letzten
beiden liegt in `C:\Users\Adrian\.todo_push_schluessel.txt` (ausserhalb von Dropbox).

Passwörter und E-Mail-Adressen gehören nicht in diese Datei (sie liegt öffentlich auf GitHub),
sondern in den Passwort-Manager. Neue Registrierungen sind in Supabase gesperrt.

## Eine Person dazunehmen (z.B. Barbara)

1. **Konto anlegen:** Supabase-Dashboard → Projekt `153-todo-app` → Authentication → Users →
   „Add user“ → „Create new user“. E-Mail und Passwort eintragen, „Auto Confirm User“ ankreuzen.
2. **Eintragen:** Supabase → SQL Editor, diese Zeile mit ihrer E-Mail ausführen („Run“):
   `select add_person('ihre-e-mail@beispiel.ch', 'Barbara');`
   Das Kürzel ist der erste Buchstabe des Namens (hier `B`). Erst danach sieht sie die gemeinsamen Listen.
3. **App installieren:** Sie öffnet https://adluethy.github.io/153-todo-app/ auf ihrem Handy,
   installiert die App (siehe oben) und meldet sich an.

Gut zu wissen:
- Umbenennen: dieselbe Zeile mit dem neuen Namen nochmals ausführen.
- Ein Konto, das nicht eingetragen ist, sieht nur seine eigenen Einträge, nie eure.
- **Vorsicht beim Löschen eines Kontos** in Supabase: Damit verschwinden auch alle Aufgaben und
  Zettel, die diese Person erfasst hat.

## Fahrplan

- [x] **Phase 1:** Prototyp mit allen Funktionen, Daten lokal im Browser
- [ ] **Phase 2:** Online-Datenbank mit Login, App online und installierbar
  - [x] Supabase-Konto und Projekt angelegt, Tabellen eingerichtet (`supabase/schema.sql`)
  - [x] App mit der Datenbank verbunden: Anmeldung, Abgleich live und offline (getestet am 22.10.2026)
  - [x] GitHub-Repository angelegt, GitHub Pages eingeschaltet
  - [ ] Auf Handy und Laptops installieren und anmelden
  - [x] Zu zweit: Kürzel und Namen in der App, gemeinsame Rechte in der Datenbank (online seit 22.10.2026)
  - [x] Zu zweit: `schema.sql` in Supabase ausgeführt, Adrian eingetragen (22.10.2026)
  - [x] Zu zweit: Barbaras Konto in Supabase angelegt (22.10.2026)
  - [ ] Barbara installiert die App auf dem iPhone und meldet sich an (Anleitung in `anleitung/`)
- [ ] **Phase 3:** Termine mit Push-Erinnerung (Plan: `PLAN-ERINNERUNGEN.md`)
  - [x] Schalter A/B, Datenbank, Dienst auf Vercel, Menü in der App gebaut und getestet (22.10.2026)
  - [x] `schema.sql` in Supabase ausgeführt, Geheimwerte in Vercel eingetragen, App online (22.10.2026)
  - [x] Erinnerungen am Android-Handy und am PC eingeschaltet, Zustellung klappt (22.10.2026)
  - [x] Barbaras Anleitung nachgeführt (Schalter A/B, Seite «Erinnerungen»)
  - [ ] Laptops und Barbaras iPhone einschalten
- [ ] **Reiter Adrian, Barbara und Gemmel** (v=7, Entwurf in `entwurf-reiter/`)
  - [x] Gebaut und getestet: Reiter, Filter, Zettel verschieben, Ablage pro Reiter (22.10.2026)
  - [x] `supabase/schema.sql` im SQL Editor ausgeführt (neues Feld `space` bei den Zetteln, 22.10.2026)
  - [x] Online seit 22.10.2026
  - [x] Auf den eigenen Geräten ausprobiert: funktioniert (22.10.2026)
  - [x] Barbaras Anleitung nachgeführt: neue Seite «Drei Reiter», alle Bilder neu (5 Seiten, 22.10.2026)
- [ ] **Neue Einträge melden** (v=8): Mitteilung bei neuen Einträgen der anderen Person im Gemmel und im eigenen Reiter
  - [x] Gebaut und getestet (23.10.2026)
  - [x] `supabase/schema.sql` ausgeführt, Dienst und App online (23.10.2026)
  - [ ] Ausprobieren; Barbaras Anleitung ergänzen

## Dateien

| Datei | Inhalt |
|---|---|
| `To-do & Zettel (online).url` | Verknüpfung, öffnet die Online-Version im Browser |
| `index.html` | Seitengerüst |
| `css/style.css` | Gestaltung, inkl. Handy-Ansicht |
| `js/config.js` | Adresse und öffentlicher Schlüssel der Datenbank |
| `js/ui.js` | Icons und Kurzmeldungen |
| `js/store.js` | Lokaler Datenspeicher auf dem Gerät |
| `js/sync.js` | Anmelden und Abgleich mit der Online-Datenbank |
| `js/layers.js` | Reiter Adrian, Barbara und Gemmel: was in welchem Reiter erscheint |
| `js/todos.js` | To-do-Liste |
| `js/notes.js` | Zettel und Ablage |
| `js/push.js` | Erinnerungen auf diesem Gerät ein- und ausschalten, Test-Mitteilung |
| `js/app.js` | Ansicht wechseln, Menü, Export/Import |
| `push/` | Erinnerungs-Dienst auf Vercel (verschickt die Mitteilungen jede Minute) |
| `PLAN-ERINNERUNGEN.md` | Plan und Entscheide zu den Erinnerungen |
| `anleitung/` | Anleitung für Barbara als PDF (nur in Dropbox, nicht auf GitHub) |
| `supabase/schema.sql` | Tabellen und Zugriffsrechte für die Online-Datenbank (im Supabase-Dashboard ausführen, darf mehrmals laufen) |
| `manifest.webmanifest`, `sw.js`, `icons/` | Damit sich die App installieren lässt und ohne Internet startet |
| `entwurf-reiter/` | Bilder und Entwurfsseite zu den drei Reitern (nur in Dropbox, nicht auf GitHub) |
| `icon-entwuerfe/` | Die vier Icon-Entwürfe und `icon_bauen.py`, das die Dateien in `icons/` erzeugt (nur in Dropbox, nicht auf GitHub) |
| `.gitignore` | Was nicht auf GitHub soll (z.B. Daten-Sicherungen) |
| `CLAUDE.md` | Hinweise für Claude, damit es am anderen PC nahtlos weitergeht |

## Git und Dropbox

Der Ordner ist ein Git-Repository und mit GitHub verbunden. Weil er in Dropbox liegt, gilt:
Änderungen immer nur von **einem** PC aus hochladen und vorher warten, bis Dropbox fertig synchronisiert hat.
Daten-Sicherungen (`todo-zettel-sicherung-*.json`) werden nie hochgeladen, weil das Repository öffentlich ist.
Nach dem Hochladen dauert es etwa eine Minute, bis die Online-Version aktualisiert ist.
