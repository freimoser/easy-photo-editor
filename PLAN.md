# Easy Photo Editor — Plan

Einseitiger Collage-Editor für Fotoabzüge. Läuft komplett im Browser, Hosting auf GitHub Pages.

## Produktfluss (MVP)

1. Anbieter wählen
2. Standardformat des Anbieters wählen
3. Weiße Fläche im Druckmaß bearbeiten (Bilder, Text, Ebenen)
4. Download
5. Neues Foto starten (aktuelles verwerfen)

Kein Fotobuch mit mehreren Seiten. Kein Projekt speichern in v1.

## Anbieter und Formate

Presets rechnen mit **300 DPI** und starten im **Querformat**. Eigenes Format: Breite/Höhe in cm, mm, Zoll oder Pixel plus DPI; Orientierung wie eingegeben (Hoch/Quer-Tausch-Button).

### Default

Generische Abzugsgrößen:

| Label | Maß |
|---|---|
| 9 × 13 cm | 90 × 130 mm |
| 10 × 15 cm | 100 × 150 mm |
| 10 × 10 cm | 100 × 100 mm |
| 13 × 18 cm | 130 × 180 mm |
| 20 × 20 cm | 200 × 200 mm |
| 20 × 30 cm | 200 × 300 mm |
| 30 × 30 cm | 300 × 300 mm |

### dm

Klassische dm-Fotoabzüge, plus große Fotos:

| Label | Maß | Quelle |
|---|---|---|
| 9 × 13 cm | 90 × 130 mm | Fotoabzüge |
| 10 × 15 cm | 100 × 150 mm | Fotoabzüge |
| 11 × 17 cm | 110 × 170 mm | Fotoabzüge |
| 13 × 18 cm | 130 × 180 mm | Fotoabzüge |
| 20 × 30 cm | 200 × 300 mm | Große Fotos |
| 30 × 45 cm | 300 × 450 mm | Große Fotos |

### Photobook

R-Serie wie bei Photobook Photo Prints. 4R ist der Einstieg:

| Label | Maß |
|---|---|
| 4R (4″ × 6″) | 101.6 × 152.4 mm |
| 5R (5″ × 7″) | 127.0 × 177.8 mm |
| 8R (8″ × 10″) | 203.2 × 254.0 mm |
| 11R (11″ × 14″) | 279.4 × 355.6 mm |

## MVP

- Desktop-first (kein Mobile-Anspruch)
- Anbieter + Format
- Weiße Arbeitsfläche, Zoom-to-fit, Safe-Zone-Overlay (3 mm innen, nur Anzeige)
- Bilder: Drag & Drop vom Rechner, Einfügen per Strg+V (JPEG/PNG/WebP/GIF)
- Text-Ebenen (Schriftart, Größe, Farbe)
- Ebenen: sichtbar, sperren, Reihenfolge, löschen, Duplizieren
- Transform: verschieben, skalieren, drehen
- Undo / Redo
- Export **JPEG Qualität 0.92** (Standard), PNG optional
- Dateiname mit Anbieter, Format, Zeitstempel
- „Neues Foto“ mit Verwerfen-Dialog

## Nicht MVP — v2

- HEIC (iPhone)
- EXIF-Ausrichtung
- Sehr große Fotos vor dem Einfügen herunterrechnen (Tab-Crash-Schutz)
- Projekt in IndexedDB speichern / fortsetzen
- Hoch/Quer für Presets (Custom hat eigenen Tausch-Button)
- Mehrere Seiten / Fotobuch
- Formen, Filter, Hintergrundfarbe, Rahmen
- Handy-Bedienung

## Technik

- Vite + TypeScript, Konva.js für die Bühne
- `base: './'` damit GitHub Pages ohne Extra-Pfad-Logik klappt
- Deploy: GitHub Actions → GitHub Pages
- Kein Backend
- Druckexport über eigenen Canvas in voller 300-DPI-Auflösung, nicht über den Screen-Canvas

## Offene Entscheidung nach MVP

Hochformat/Querformat und freie cm-Maße. Im MVP liegt jedes Rechteck-Format quer.
