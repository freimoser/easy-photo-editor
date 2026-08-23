# Easy Photo Editor — Texte (Quelle)

Landing (`index.html`) bleibt kurz: Pitch + **App starten**.
Ausführliche **So geht’s** und **Funktionen** stehen in `app.html` (`#how`, `#features`).

Bei jeder nutzer-sichtbaren Änderung: zuerst hier, dann `app.html` angleichen. Skill: `.grok/skills/startseite-docs/SKILL.md`.

Stand: 2026-08-23

## Landing (index.html)

- Zeile: Druckfertige Collagen für Fotoabzüge — im Browser, ohne Upload.
- CTA: App starten → `app.html`
- Drei Punkte: Format fürs Labor · Bilder & Text auf der Fläche · JPEG herunterladen

## So geht’s (app.html)

1. Anbieter wählen (Default, dm oder Photobook).
2. Format wählen oder unter **Eigenes Format** Breite, Höhe, Einheit (cm / mm / Zoll / Pixel) und DPI setzen.
3. **Foto anlegen** — weiße Fläche in Druckgröße (300 DPI bei Presets).
4. Bilder per Drag & Drop, **Bilder**-Button oder **Strg+V** einfügen. Text über **Text**.
5. Ebenen rechts: Reihenfolge, sichtbar, sperren, **★ behalten**. Fotos drehen, skalieren, umranden.
6. **JPEG** (Standard, Druck) oder **PNG** herunterladen. **Gleiches Format** startet das nächste Foto; **★**-Ebenen bleiben. **Neues Foto** bleibt in der App bei der Formatwahl, markierte Ebenen kommen mit.
7. Arbeit bleibt im **Browser-Cache** (IndexedDB). Tab schließen fragt nach. **Verlauf** zeigt frühere Stände.

## Funktionen (app.html)

- Anbieter-Presets: Default, dm, Photobook (inkl. 4R)
- Eigenes Maß in cm, mm, Zoll oder Pixel plus DPI; Hoch/Quer tauschen
- Safe Zone (3 mm, nur Anzeige)
- Einpassen: beim Einfügen und bei 90°-Drehung aufs Format skalieren (abschaltbar)
- Bilder: Drag & Drop, Datei-Dialog, Zwischenablage (JPEG, PNG, WebP, GIF — kein HEIC)
- Text: schreiben (Doppelklick), Größe, Farbe aus Palette, Picker oder Hex
- Ebenen: nach vorne/hinten, ziehen, ein-/ausblenden, sperren, duplizieren, löschen
- ★ Behalten: Ebene überlebt Gleiches Format und Neues Foto
- Transformieren: verschieben, Ecken skalieren, frei drehen, 90°/180°-Buttons
- Umrandung: Stärke in mm, Farbe aus Palette, Picker oder Hex
- Rückgängig / Wiederholen
- Export JPEG Qualität 0,92 oder PNG, Dateiname mit Anbieter und Format
- Verlauf: frühere Stände lokal merken und wiederherstellen
- Cache: Sitzung und Bilder im Browser speichern, Warnung beim Schließen
- Läuft nur im Browser, keine Uploads, keine Cloud

## Bewusst nicht versprechen

- HEIC / iPhone-Rohformat
- Handy-Bedienung
- Mehrseitiges Fotobuch
- Speichern eines Projekts in der Cloud / auf einem Server (nur lokal im Browser)
