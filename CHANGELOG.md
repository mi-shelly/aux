# Changelog

## 1.4.0 – 2026-10-21

### Neu
- **Lesemaske**: dunkelt die Seite ab, nur ein Streifen (120 px) um Maus, Finger oder Tastatur-Fokus bleibt hell. Schliesst sich mit dem Lese-Lineal gegenseitig aus.
- **Graustufen** (Toggle) und **Helligkeit** (Stepper −2 … +2). Beide sind mit den Kontrastmodi kombinierbar, die Filter werden zu einem einzigen `filter` zusammengesetzt.
- **Zurücksetzen-Button** im festen Footer des Panels, löscht auch den gespeicherten Zustand (`localStorage`).
- Das Panel ist jetzt ein **Off-Canvas** über die volle Seitenhöhe (fährt von der Seite des Widgets ein).
- Aktive Optionen sind zusätzlich zur Farbe durch Häkchen und stärkeren Rahmen markiert.
- Stepper-Beschriftungen für Screenreader sind übersetzbar (`decrease` / `increase`).
- Cache-Buster (`?v=<Änderungszeit>`) an CSS- und JS-URLs.
- Barrierefreiheit des Widgets selbst:
  - Das Widget ist der erste Tab-Stopp der Seite (liegt vor `<body>`), statt erst nach allen Seitenelementen erreichbar zu sein.
  - Optionsgruppen (Profile, Kontrast, Textausrichtung, Stepper, Position) sind als `role="group"` mit Namen ausgezeichnet.
  - Schalter 44×24 px (WCAG 2.2 Zielgröße), Rahmen der Bedienelemente mit mindestens 3:1 Kontrast, keine Schrift unter 12 px.
  - Unterstützung für Windows-Kontrastmodus (`forced-colors`): Schalter und Häkchen bleiben sichtbar.
  - Die Meldung „Widget ausgeblendet“ wird als `role="status"` angekündigt.
  - `Strg/⌘ + Alt + A` öffnet und schliesst jetzt auch das Panel, wenn das Widget sichtbar ist.
  - **Textleser-Statusleiste**: Solange der Textleser aktiv ist (er fängt Klicks auf Links und Buttons ab), zeigt eine Leiste am unteren Rand den Zustand an (`role="status"`) und bietet „Beenden“. `Esc` beendet den Textleser ebenfalls.
  - **Schriftgrössen folgen der Browser-Einstellung**: Das Panel skaliert mit der Standard-Schriftgrösse des Browsers (`max(14px, 0.875rem)`, also nie kleiner als 14 px, auch auf Seiten mit `html { font-size: 62.5% }`).
- **Konfiguration**: Warnung im Backend, wenn die Button-Farbe weniger als 3:1 Kontrast zu Weiss hat (weisses Icon, Fokusring, Aktiv-Markierungen; WCAG 1.4.11). Neue Methode `Aux::contrastRatio()`, neuer Sprachschlüssel `aux_button_color_warning`.

- **Robustheit auf beliebigen Seiten:**
  - Das Widget läuft in einem **Shadow DOM**: Das CSS der Seite (Resets, `button`-/`h2`-/`*`-Regeln, `!important`) kann das Widget nicht mehr verändern. Das Widget-Stylesheet wird vom Script in den Shadow-Root geladen; bis es geladen ist, bleibt das Widget ausgeblendet.
  - Die Konfiguration steht als JSON-Datenblock (`<script type="application/json" id="aux-config">`) statt als Inline-JavaScript. Das funktioniert auch mit strenger Content-Security-Policy (`script-src 'self'`, `style-src 'self'`).
  - Das Widget wird vor dem **letzten** `</body>` eingefügt (Gross-/Kleinschreibung egal). Ein früheres `</body>` in einem Script-String oder `srcdoc` führt nicht mehr zu doppelter Einbindung oder fehlendem Widget. Mehrfaches Einbinden des Scripts erzeugt nur eine Instanz.
  - Seitenwechsel ohne Reload (Turbo, Swup, PJAX …), die `<body>` austauschen, behalten Filter und Einstellungen.
  - Beim Drucken werden Filter und Farbüberschreibung entfernt, Widget, Maske und Lineal werden nicht gedruckt.
  - Höherer `z-index`, damit Cookie-Banner und Modals das Panel nicht verdecken.
  - Der Hintergrundbild-Scan für Dunkel/Invertiert läuft nur einmal pro Moduswechsel statt bei jeder Einstellung.
  - Sprache: Deutsch und Englisch sind übersetzt, andere bekannte Sprachen (`es`, `fr`, `it` …) erhalten Englisch statt Deutsch, unbekannte Codes bleiben bei Deutsch. Das Widget trägt ein passendes `lang`-Attribut, der Textleser liest in der Sprache der Seite (`<html lang>`).
  - Das Lese-Lineal liegt wie die Maske unter `<html>` (nicht mehr im gefilterten `<body>`).

- **Nichts springt mehr, wenn eine Option aktiviert wird**: Aktive Optionen werden nicht mehr fett (fetter Text ist breiter) und bekommen kein Häkchen, das den Text verschiebt. Stattdessen reservieren alle Buttons einen Platz für einen Indikator: leerer Kreis = aus, gefüllter Kreis mit Häkchen = an, dazu stärkerer Rahmen (innerer Schatten, ohne Platzbedarf). Geprüft: Jeder Klick auf jedes Bedienelement lässt Position und Grösse aller Elemente im Panel unverändert (ausser dem Schalter-Knopf, der wie vorgesehen gleitet). Zusätzlich `scrollbar-gutter: stable` im Panel.

### Geändert
- Der dekorative Männchen-Icon im Panel-Header entfällt (der Button trägt es bereits); die sichtbare Überschrift bleibt als Name des Panels.
- Emoji-Icons der Profile, Schliessen- und Reset-Button durch Inline-SVGs (Stroke-Stil) ersetzt, alle mit `aria-hidden="true"`.
- **Hoher Kontrast** arbeitet jetzt mit Farbüberschreibung (weiss auf schwarz, gelbe Links, weisse Rahmen) statt mit `contrast()`-Filter. Der Filter machte helle Elemente noch heller und damit unsichtbar.
- Das Widget liegt als Kind von `<html>` (nicht mehr in `<body>`); Filter liegen auf `<body>`. Dadurch wird das Widget nie mitgefiltert; die bisherige Positions-Korrektur (`applyContrastPositionFix`) und das Gegen-Invertieren des Widgets entfallen.
- Zurücksetzen setzt auch die Widget-Position auf die Server-Vorgabe zurück.
- Optik überarbeitet: ein einheitlicher Radius (6 px, Schalter und Haken bleiben rund), einheitliches Abstandsraster (4 / 8 / 16 / 20 px), Bedienelemente mit gleicher Höhe, ruhigere Farben (`#111827` / `#4b5563`), Aktiv-Farbe leitet sich per `color-mix` aus der Button-Farbe ab. Der Button ist ein abgerundetes Quadrat statt eines Kreises. Kontrast, Zielgrössen und Häkchen bleiben unverändert.
- **Grosser Cursor** überarbeitet: Pfeil, Hand und Text-Cursor in 48 px (vorher war der Zeiger-Cursor ein auf den Kopf gedrehter Pfeil). Die Hand gilt für Links, Buttons, `summary`, Labels, Checkboxen, Radios, Selects, `[role=button|link|tab|…]`, `[onclick]` und fokussierbare Elemente samt deren Kindelementen; Eingabefelder erhalten einen grossen Text-Cursor. Der grosse Cursor gilt jetzt auch im Widget selbst (Shadow DOM); die Cursor sind dafür CSS-Variablen auf `<html>` (`--aux-cur-arrow|hand|text`), der Hotspot des Pfeils liegt an der Spitze.
- Das Panel ist 420 px breit (vorher 380 px), damit die vier Textausrichtungs-Buttons in einer Zeile stehen. Profil-Kacheln haben gleich breite Spalten, lange Wörter brechen um statt zu überlaufen.
- **Dyslexie-Schrift auch im Widget**: Die Schriftart (nicht Buchstaben- oder Zeilenabstand, die das Layout sprengen würden) gilt auch für das Panel, über die CSS-Variable `--aux-font` auf `<html>`. Buttons erben jetzt die Schrift des Widgets.
- Stepper zeigen positive Werte mit Vorzeichen (`+1`).
- Auf Smartphones (bis 420 px) nutzt das Panel die volle Breite.
- **Unabhängig vom `<meta name="viewport">` der Seite**: Das Widget richtet sich am sichtbaren Viewport aus (`visualViewport`) und gleicht dessen Skalierung aus. Auch auf Seiten ohne Viewport-Meta (Handy rechnet dann mit ~980 px Breite) oder bei Pinch-Zoom bleiben Button und Panel in normaler Grösse an derselben Stelle sichtbar. Die Breite des Panels richtet sich nach dem Viewport statt nach `100vw`.
- Stepper (Helligkeit, Textgrösse, Zeilen- und Buchstabenabstand) stehen als Zeile: Beschriftung links, Bedienelement rechts.

### Behoben
- Erste Reihe der Profil-Kacheln wurde vom Header überdeckt: Panel ist jetzt Flex-Spalte (Header fix / Inhalt scrollt / Footer fix).
- Fokus sprang beim Öffnen nicht ins Panel (`visibility`-Übergang), und beim Schliessen über den Schliessen-Button nicht zurück auf den Öffnen-Button.
- Dyslexie-Schrift, Zeilen-/Buchstabenabstand, Textausrichtung und „Animationen stoppen“ wirkten auch auf das Widget selbst (Text lief aus dem Panel). Die Regeln gelten jetzt nur noch für `body`.
- Stepper-Beschriftungen waren fest auf Deutsch kodiert.
- Die Focus-Hervorhebung (orangefarbener Ring) wirkte auch auf die Bedienelemente des Widgets und überlagerte dessen eigenen Fokusring. Sie gilt jetzt nur noch für die Seite.
- Das Lese-Lineal folgt jetzt auch dem Finger (`touchmove`), nicht nur der Maus.
- Auf Geräten ohne Maus oder Trackpad (`any-pointer: fine` trifft nicht zu) wird „Cursor vergrössern“ nicht mehr angezeigt.
- Typ-Annotationen in `Aux.php` ergänzt (`inject()`, `getTranslations()`), das AddOn ist damit auf PHPStan Level 6 (Rexstan) ohne Funde.
- Reset und Textleser warfen in Browsern ohne `speechSynthesis` einen Fehler.

## 1.3.1

Vorherige Version (siehe Git-Historie).
