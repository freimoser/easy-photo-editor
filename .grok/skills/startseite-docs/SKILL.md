---
name: startseite-docs
description: Keep the Easy Photo Editor start page how-to and feature list in sync with FEATURES.md whenever user-facing features change. Use when adding, removing, or renaming editor functions, changing the start page, or when the user mentions Erklärung, Funktionen, Startseite, So geht’s.
---

# Startseite immer mitziehen

Quelle der Wahrheit: `FEATURES.md` im Projektroot.

## Wann

Jede Änderung, die ein Nutzer auf der Startseite oder im Editor sieht: neue Buttons, neue Formate, geänderter Export, neue Ebenen-Funktionen, entfernte Features.

## Ablauf

1. `FEATURES.md` aktualisieren (So geht’s, Funktionen, „nicht versprechen“, Datum).
2. Dieselben Fakten in `index.html` in `#how` und `#features` spiegeln. Keine extra Marketing-Sätze, die nicht in `FEATURES.md` stehen.
3. Footer-Links zu Impressum/Datenschutz nicht entfernen.
4. Nicht in `PLAN.md` duplizieren — PLAN ist Historie, FEATURES.md ist die Startseite.

## Check

Wenn ein Button oder eine Funktion im Editor existiert, muss sie in `FEATURES.md` stehen oder unter „bewusst nicht versprechen“.
