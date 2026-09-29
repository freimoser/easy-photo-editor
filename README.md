# Easy Photo Editor

Kostenloser Collage-Editor im Browser für **Fotoabzüge**. Format wählen wie am Automaten (dm, Photobook, eigenes Maß in cm), Bilder und Text auf die Fläche legen, als **JPEG** fürs Fotolabor herunterladen. Keine Anmeldung, kein Upload.

**Live:** [freimoser.github.io/easy-photo-editor](https://freimoser.github.io/easy-photo-editor/) · [App starten](https://freimoser.github.io/easy-photo-editor/app.html)

## Features

- **Druckmaße:** Presets für Default, [dm](https://foto.dm.de/) und Photobook (inkl. 4R / 4″×6″), plus eigene Größe in cm, mm, Zoll oder Pixel und DPI
- **Collage:** Drag & Drop, Datei-Dialog oder Einfügen aus der Zwischenablage (JPEG, PNG, WebP, GIF)
- **Ebenen:** Reihenfolge, ein-/ausblenden, sperren, duplizieren — ★-Ebenen bleiben beim nächsten Foto
- **Bearbeiten:** verschieben, skalieren, 90°/180° drehen, Text, Umrandung mit Palette oder Hex
- **Einpassen:** Bilder beim Einfügen und bei 90°-Drehung aufs Format skalieren (abschaltbar)
- **Safe Zone:** 3 mm Rand als Overlay, damit nichts Wichtiges abgeschnitten wird
- **Export:** JPEG (Qualität 0,92, Standard für Abzüge) oder PNG
- **Lokal:** Sitzung, Bilder und Verlauf liegen im Browser (IndexedDB). Beim Schließen des Tabs kommt eine Warnung. Nichts geht auf einen Server.

Nicht enthalten: HEIC, Mobil-Layout, mehrseitige Fotobücher, Cloud-Speicher.

## Nutzung

1. [App starten](https://freimoser.github.io/easy-photo-editor/app.html)
2. Anbieter und Format wählen (oder eigenes Maß)
3. **Foto anlegen**
4. Bilder und Text auf die weiße Fläche
5. **JPEG** herunterladen und im Labor / Online-Shop bestellen
6. **Gleiches Format** fürs nächste Abzug — oder **Neues Foto** für ein anderes Maß

Hintergrund: [Artikel, wie der Editor mit Grok entstanden ist](https://freimoser.github.io/easy-photo-editor/artikel.html)

## Entwicklung

```bash
npm install
npm run dev
```

Build für GitHub Pages: `npm run build` (Vite, statisch, Branch `main` → Actions).

## Appendix: Über den Autor

[Serdar Freimoser](https://freimoser.github.io/easy-photo-editor/ueber-mich.html), München. Kleine, genaue Web-Tools statt Allzweck-Suiten.

| Projekt | Was es ist |
| --- | --- |
| [Easy Photo Editor](https://freimoser.github.io/easy-photo-editor/) | Dieser Editor — Druckcollagen für Fotoabzüge |
| [Backlinkforme](https://backlinkforme.com/free-backlink-sites) | Kuratiertes Verzeichnis kostenloser Backlink-Sites, SEO-Tools und Guest Posts |
| [Schaumorakel](https://schaumorakel.com/) | Cappuccino-Schaum deuten (Tasseografie im Browser) |
| [Next Game Finder](https://nextgamefinder.org/) | Spielempfehlungen nach Laune, Zeit und Geschmack; Cross-Play und Couch-Co-op |
| [Solvitalk](https://solvitalk.com/) | 25-Minuten-Gespräch beim Spazieren, Matching per Google Meet |
| [GDT Viewer](https://freimoser.github.io/gdt-viewer/) | GDT 2.1 / 3.x lesen und Testdateien erzeugen, ohne Upload |

Kontakt: [Impressum](https://freimoser.github.io/easy-photo-editor/impressum.html)
