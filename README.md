# Aux – Accessibility Widget for REDAXO

Ein Barrierefreiheits-Widget als REDAXO-AddOn. Aux zeigt einen schwebenden Button auf deiner Website, der Besuchern zahlreiche Barrierefreiheits-Optionen bietet.

![REDAXO](https://img.shields.io/badge/REDAXO-%3E%3D5.16-red) ![PHP](https://img.shields.io/badge/PHP-%3E%3D8.1-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## Wichtiger Hinweis zur Barrierefreiheit

> **Aux ersetzt keine echte Barrierefreiheit.**
>
> Ein zugängliches Web entsteht durch saubere semantische HTML-Struktur, ausreichende Farbkontraste, sinnvolle Alt-Texte, korrekte ARIA-Attribute und eine durchdachte Tastaturnavigation – kurz: durch barrierefreie Entwicklung von Grund auf.
>
> Aux ist ein ergänzendes Hilfsmittel für Nutzer, die auf einer Website individuelle Anpassungen benötigen (z. B. größere Schrift, höherer Kontrast, Dyslexie-Schrift). Es verbessert die Benutzbarkeit für bestimmte Zielgruppen – es macht eine Seite aber nicht automatisch WCAG-konform oder BFSG-compliant.
>
> Die Optionen arbeiten nach dem **Best-Effort-Prinzip**: CSS-Klassen werden auf `<html>` gesetzt (Filter auf `<body>`) und greifen in den meisten Fällen zuverlässig. Auf Seiten mit sehr spezifischen Styles können einzelne Anpassungen eingeschränkt wirken.
>
> **Aux ist kein Ersatz für einen Accessibility-Audit.**

## Features

### Accessibility-Profile
Vorkonfigurierte Presets mit einem Klick aktivieren:
- **Sehbehinderung** – Hoher Kontrast, Textvergrösserung, grosser Cursor, Focus-Hervorhebung
- **Dyslexie** – OpenDyslexic Schrift, erhöhter Zeilen-/Buchstabenabstand
- **ADHS** – Lese-Lineal, Animationen stoppen, Focus-Hervorhebung
- **Motorische Einschränkung** – Grosser Cursor, Focus-Hervorhebung
- **Kognitive Einschränkung** – Textvergrösserung, Links/Überschriften hervorheben
- **Epilepsie** – Animationen und Blinken stoppen

### Einzelne Optionen
- Kontrastmodi (Dunkel, Hell, Hoher Kontrast, Invertiert)
  - *Hoher Kontrast* überschreibt die Farben (weiss auf schwarz, gelbe Links, weisse Rahmen) statt zu filtern – so bleiben auch helle Elemente erkennbar
- Graustufen (kombinierbar mit Invertiert und Helligkeit)
- Helligkeit (5 Stufen, −2 bis +2, kombinierbar mit allen Filtern)
- Textgrösse (3 Stufen)
- Zeilenabstand (3 Stufen)
- Buchstabenabstand (3 Stufen)
- Textausrichtung (Links / Zentriert / Rechts)
- Textleser (Vorlesen via Web Speech API)
- Links hervorheben
- Überschriften-Hierarchie sichtbar machen
- Lese-Lineal (folgt der Maus)
- Lesemaske (dunkelt die Seite bis auf einen Streifen um Maus, Finger bzw. Tastatur-Fokus ab; schliesst sich mit dem Lese-Lineal gegenseitig aus)
- Dyslexie-Schrift (OpenDyslexic, auch im Widget selbst)
- Focus-Hervorhebung
- Cursor vergrössern (grosser Pfeil, Hand und Text-Cursor, auch im Widget)
- Animationen und Videos stoppen
- Bilder ausblenden
- Widget-Position im Frontend umschalten (Links / Rechts / Ausblenden)
- Zurücksetzen (im festen Footer, setzt alles auf Standard und löscht den gespeicherten Zustand)

### Technische Details
- Einstellungen werden in localStorage gespeichert (bleiben beim nächsten Besuch erhalten)
- DSGVO-konform: Keine Cookies, kein Tracking
- Leichtgewichtig: Reines Vanilla JS + CSS, kein Framework
- Automatische Injection via REDAXO Extension Point (kein Template-Code nötig)
- Vollständig per Tastatur bedienbar: ESC schliesst das Panel, der Fokus springt beim Öffnen ins Panel und beim Schliessen zurück auf den Button
- Panel als Off-Canvas über die volle Seitenhöhe (Header und Footer fix, Inhalt scrollt), Aktiv-Zustände nicht nur über Farbe (Häkchen, Rahmen)
- Einheitliche Optik: ein Radius (6 px), festes Abstandsraster, Bedienelemente mit gleicher Höhe; Farben und Abstände sind CSS-Variablen (`--aux-*` an `.aux-widget`), die Aktiv-Farbe leitet sich aus der Button-Farbe ab
- Das Widget wird nie gefiltert: Es liegt als Kind von `<html>` ausserhalb von `<body>`, der gesamte Filter (Kontrast, Graustufen, Helligkeit) wird zu einem einzigen `filter` auf `<body>` zusammengesetzt
- Läuft in einem Shadow DOM: Seiten-CSS kann das Widget nicht verändern; funktioniert mit strenger Content-Security-Policy (Konfiguration als JSON-Datenblock, kein Inline-Script)
- Respektiert `prefers-reduced-motion`, den Windows-Kontrastmodus (`forced-colors`) und die Schriftgrössen-Einstellung des Browsers
- Textleser mit Statusleiste und Beenden-Button (auch per `Esc`)
- Responsive: Passt sich auf Mobilgeräten an, unabhängig vom `<meta name="viewport">` der Seite und auch bei Pinch-Zoom (das Widget folgt dem sichtbaren Viewport und gleicht dessen Skalierung aus)
- Lese-Lineal und Lesemaske funktionieren mit Maus, Finger und (Maske) Tastatur-Fokus; „Cursor vergrössern“ wird auf Geräten ohne Maus ausgeblendet
- Mehrsprachig: Deutsch und Englisch

## Bekannte Einschränkungen

- Filter (Dunkel, Hell, Invertiert, Graustufen, Helligkeit) liegen auf `<body>`. Elemente mit `position: fixed` verankern sich dadurch am `<body>` statt am Viewport (verhielt sich vorher mit dem Filter auf `<html>` genauso).
- Ein Hintergrundbild direkt auf `<html>` liegt im gefilterten Modus unter dem Farb-Backdrop (Hintergrundbilder auf `<body>` sind nicht betroffen).
- *Hoher Kontrast* überschreibt Hintergrund-, Text- und Rahmenfarben der Seite. Icons mit fest gesetzter `fill`-Farbe behalten diese.
- Mit strenger CSP müssen CSS und JS des AddOns von derselben Herkunft erlaubt sein (`script-src 'self'`, `style-src 'self'`, `img-src data:`).
- Solange der Textleser aktiv ist, sind Links und Buttons der Seite nicht anklickbar (Statusleiste zum Beenden, `Esc`).

## Barrierefreiheit des Widgets selbst

Geprüft mit axe-core (WCAG 2.2 AA, keine Verstösse) sowie manuell: Tastatur, Zoom bis 400 % (320 × 256 px), Windows-Kontrastmodus, Zielgrössen (mindestens 24 px) und Kontrast der Bedienelemente. Ein Test mit Screenreadern (NVDA, VoiceOver) wird empfohlen.

## Installation

### Über den REDAXO Installer
1. Im Backend unter **Installer** nach **aux** suchen
2. Herunterladen und installieren
3. Unter **AddOns** aktivieren

### Manuell
1. Repository herunterladen/klonen
2. Ordner nach `redaxo/src/addons/aux/` kopieren
3. Im Backend unter **AddOns** installieren und aktivieren

## Konfiguration

Im Backend unter **AddOns > Aux > Einstellungen**:

| Option | Beschreibung | Standard |
|--------|-------------|----------|
| Widget aktiv | Widget im Frontend anzeigen | Ja |
| Button-Position | Position des Floating Buttons | Unten rechts |
| Button-Farbe | Farbe des Floating Buttons (Warnung bei weniger als 3:1 Kontrast zu Weiss) | #1a73e8 |

## Tastatur-Shortcut

Mit `Strg + Alt + A` (Mac: `⌘ + ⌥ + A`) öffnest und schliesst du das Panel. Wenn du das Widget im Frontend ausgeblendet hast, blendet derselbe Shortcut es wieder ein:
- **Windows/Linux**: `Strg + Alt + A`
- **Mac**: `⌘ + ⌥ + A`

## Wie es funktioniert

Das AddOn nutzt den REDAXO Extension Point `OUTPUT_FILTER`, um das Widget automatisch vor dem `</body>`-Tag einzufügen. Es ist kein manueller Template-Code erforderlich. Die Asset-URLs enthalten die Änderungszeit der Datei (`?v=…`), damit nach Updates keine veralteten Dateien aus dem Browser-Cache geladen werden.

## Lizenz

MIT License – siehe [LICENSE](LICENSE)

OpenDyslexic Font: SIL Open Font License 1.1

## Autor

Michelle Falke

## Credits

- [OpenDyslexic](https://opendyslexic.org/) – Dyslexie-freundliche Schrift von Abbie Gonzalez
- [REDAXO CMS](https://redaxo.org/) – Content Management System
- [FriendsOfREDAXO](https://friendsofredaxo.github.io/) – REDAXO Community
