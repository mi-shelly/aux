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
> Die Optionen arbeiten nach dem **Best-Effort-Prinzip**: CSS-Klassen werden auf `<html>` gesetzt und greifen in den meisten Fällen zuverlässig. Auf Seiten mit sehr spezifischen Styles können einzelne Anpassungen eingeschränkt wirken.
>
> **Aux ist kein Ersatz für einen Accessibility-Audit.**

## Features

### Accessibility-Profile
Vorkonfigurierte Presets mit einem Klick aktivieren:
- **Sehbehinderung** – Hoher Kontrast, Textvergrösserung, grosser Cursor
- **Dyslexie** – OpenDyslexic Schrift, erhöhter Zeilen-/Buchstabenabstand
- **ADHS** – Lese-Lineal, Animationen stoppen, Focus-Hervorhebung
- **Motorische Einschränkung** – Grosser Cursor, Focus-Hervorhebung
- **Kognitive Einschränkung** – Textvergrösserung, Links/Überschriften hervorheben
- **Epilepsie** – Animationen und Blinken stoppen

### Einzelne Optionen
- Kontrastmodi (Dunkel, Hell, Hoher Kontrast, Invertiert)
- Textgrösse (3 Stufen)
- Zeilenabstand (3 Stufen)
- Buchstabenabstand (3 Stufen)
- Textausrichtung (Links / Zentriert / Rechts)
- Textleser (Vorlesen via Web Speech API)
- Links hervorheben
- Überschriften-Hierarchie sichtbar machen
- Lese-Lineal (folgt der Maus)
- Dyslexie-Schrift (OpenDyslexic)
- Focus-Hervorhebung
- Cursor vergrössern
- Animationen und Videos stoppen
- Bilder ausblenden
- Widget-Position im Frontend umschalten (Links / Rechts / Ausblenden)

### Technische Details
- Einstellungen werden in localStorage gespeichert (bleiben beim nächsten Besuch erhalten)
- DSGVO-konform: Keine Cookies, kein Tracking
- Leichtgewichtig: Reines Vanilla JS + CSS, kein Framework
- Automatische Injection via REDAXO Extension Point (kein Template-Code nötig)
- Vollständig per Tastatur bedienbar
- Responsive: Passt sich auf Mobilgeräten an
- Mehrsprachig: Deutsch und Englisch

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
| Button-Farbe | Farbe des Floating Buttons | #1a73e8 |

## Tastatur-Shortcut

Wenn du das Widget im Frontend ausgeblendet hast, kannst du es jederzeit wieder einblenden:
- **Windows/Linux**: `Strg + Alt + A`
- **Mac**: `⌘ + ⌥ + A`

## Wie es funktioniert

Das AddOn nutzt den REDAXO Extension Point `OUTPUT_FILTER`, um das Widget automatisch vor dem `</body>`-Tag einzufügen. Es ist kein manueller Template-Code erforderlich.

## Lizenz

MIT License – siehe [LICENSE](LICENSE)

OpenDyslexic Font: SIL Open Font License 1.1

## Autor

Michelle Falke

## Credits

- [OpenDyslexic](https://opendyslexic.org/) – Dyslexie-freundliche Schrift von Abbie Gonzalez
- [REDAXO CMS](https://redaxo.org/) – Content Management System
- [FriendsOfREDAXO](https://friendsofredaxo.github.io/) – REDAXO Community
