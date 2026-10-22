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

**To-do**
- Aufgabe oben eintippen, Enter oder `+`. Mit dem Kalender-Knopf daneben gleich einen Termin setzen.
- Vorne steht, wer die Aufgabe erfasst hat: `A:` = Adrian, `B:` = Barbara.
  Wer sie erledigt, macht ihr unter euch aus; abhaken und löschen können beide.
- 1. Kästchen = erledigt → Schrift wird hellgrau.
- 2. Kästchen = löschen → geht erst, wenn die Aufgabe erledigt ist. Die Aufgabe verschwindet.
- Auf den Text klicken, um ihn zu ändern (Enter speichert, Esc bricht ab).
- An den Punkten links ziehen, um die Reihenfolge zu ändern.
- Termin ändern oder entfernen: auf das Datum klicken (oder das Kalender-Symbol rechts).

**Zettel**
- „Neue Idee“ (gelb) oder „Neue Info“ (blau) legt einen Zettel an. Es können beliebig viele offen sein.
- Unten rechts steht, wer den Zettel geschrieben hat.
- Zettel und ihre Plätze sind für beide gleich: Wer am PC einen Zettel verschiebt, verschiebt ihn auch beim anderen.
- Am farbigen Kopf ziehen = verschieben. Ecke unten rechts ziehen = Grösse ändern.
- `×` oben rechts = schliessen. Der Zettel kommt in die **Ablage** und kann dort wieder geöffnet
  oder endgültig gelöscht werden.
- Ideen-Zettel haben zusätzlich den Knopf „Als Aufgabe übernehmen“: Der Text wird zur Aufgabe,
  der Zettel kommt in die Ablage. Die Aufgabe bekommt das Kürzel der Person, die die Idee hatte.

**Handy (schmaler Bildschirm)**
- Unten umschalten zwischen „To-do“ und „Zettel“.
- Die Zettel erscheinen als Stapel (neueste oben), ohne Verschieben und Grösse ändern.

**Abmelden:** Menü `⋯` → „Abmelden“. Meldet nur dieses Gerät ab und löscht dort die lokale Kopie.

## Konten

| Dienst | Konto | Wofür |
|---|---|---|
| GitHub | Benutzer `adluethy`, Repository https://github.com/adluethy/153-todo-app | Code ablegen und die App online stellen (GitHub Pages) |
| Supabase | Anmeldung über GitHub (`adluethy`), angelegt am 22.10.2026, Projekt `153-todo-app` | Online-Datenbank und Login |
| App-Login | je eine Anmeldung für Adrian und Barbara (E-Mail und Passwort), angelegt in Supabase unter Authentication → Users | Anmelden in der App auf allen Geräten |

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
  - [x] Zu zweit: Kürzel und Namen in der App, gemeinsame Rechte in der Datenbank (22.10.2026)
  - [ ] Zu zweit: `schema.sql` in Supabase ausführen, Adrian und Barbara eintragen, Barbaras Konto anlegen
- [ ] **Phase 3:** Termine mit Push-Benachrichtigung aufs Handy

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
| `js/todos.js` | To-do-Liste |
| `js/notes.js` | Zettel und Ablage |
| `js/app.js` | Ansicht wechseln, Menü, Export/Import |
| `supabase/schema.sql` | Tabellen und Zugriffsrechte für die Online-Datenbank (im Supabase-Dashboard ausführen, darf mehrmals laufen) |
| `manifest.webmanifest`, `sw.js`, `icons/` | Damit sich die App installieren lässt und ohne Internet startet |
| `.gitignore` | Was nicht auf GitHub soll (z.B. Daten-Sicherungen) |
| `CLAUDE.md` | Hinweise für Claude, damit es am anderen PC nahtlos weitergeht |

## Git und Dropbox

Der Ordner ist ein Git-Repository und mit GitHub verbunden. Weil er in Dropbox liegt, gilt:
Änderungen immer nur von **einem** PC aus hochladen und vorher warten, bis Dropbox fertig synchronisiert hat.
Daten-Sicherungen (`todo-zettel-sicherung-*.json`) werden nie hochgeladen, weil das Repository öffentlich ist.
Nach dem Hochladen dauert es etwa eine Minute, bis die Online-Version aktualisiert ist.
