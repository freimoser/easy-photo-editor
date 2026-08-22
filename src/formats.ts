export type PrintFormat = {
  id: string;
  label: string;
  /** Short description under the label */
  hint: string;
  widthMm: number;
  heightMm: number;
};

export type Provider = {
  id: string;
  name: string;
  blurb: string;
  formats: PrintFormat[];
};

const CM = (w: number, h: number) => ({
  widthMm: w * 10,
  heightMm: h * 10,
});

const IN = (w: number, h: number) => ({
  widthMm: w * 25.4,
  heightMm: h * 25.4,
});

export const DPI = 300;
export const SAFE_ZONE_MM = 3;
export const CUSTOM_FORMAT_ID = "custom";
export const MAX_EXPORT_PX = 8000;
export const MIN_SIDE_MM = 5;

export const providers: Provider[] = [
  {
    id: "default",
    name: "Default",
    blurb: "Gängige Abzugsgrößen, unabhängig vom Labor.",
    formats: [
      { id: "9x13", label: "9 × 13 cm", hint: "Klein, Album", ...CM(9, 13) },
      { id: "10x15", label: "10 × 15 cm", hint: "Klassiker", ...CM(10, 15) },
      { id: "10x10", label: "10 × 10 cm", hint: "Quadrat", ...CM(10, 10) },
      { id: "13x18", label: "13 × 18 cm", hint: "Rahmenmaß", ...CM(13, 18) },
      { id: "20x20", label: "20 × 20 cm", hint: "Quadrat groß", ...CM(20, 20) },
      { id: "20x30", label: "20 × 30 cm", hint: "Vergrößerung", ...CM(20, 30) },
      { id: "30x30", label: "30 × 30 cm", hint: "Wand", ...CM(30, 30) },
    ],
  },
  {
    id: "dm",
    name: "dm",
    blurb: "Fotoabzüge und große Fotos im dm-Fotoservice.",
    formats: [
      { id: "dm-9x13", label: "9 × 13 cm", hint: "Fotoabzug", ...CM(9, 13) },
      { id: "dm-10x15", label: "10 × 15 cm", hint: "Fotoabzug", ...CM(10, 15) },
      { id: "dm-11x17", label: "11 × 17 cm", hint: "Fotoabzug", ...CM(11, 17) },
      { id: "dm-13x18", label: "13 × 18 cm", hint: "Fotoabzug", ...CM(13, 18) },
      { id: "dm-20x30", label: "20 × 30 cm", hint: "Großes Foto", ...CM(20, 30) },
      { id: "dm-30x45", label: "30 × 45 cm", hint: "Großes Foto", ...CM(30, 45) },
    ],
  },
  {
    id: "photobook",
    name: "Photobook",
    blurb: "R-Serie, 4R ist das Standardmaß 4″ × 6″.",
    formats: [
      { id: "pb-4r", label: "4R (4″ × 6″)", hint: "10,2 × 15,2 cm", ...IN(4, 6) },
      { id: "pb-5r", label: "5R (5″ × 7″)", hint: "12,7 × 17,8 cm", ...IN(5, 7) },
      { id: "pb-8r", label: "8R (8″ × 10″)", hint: "20,3 × 25,4 cm", ...IN(8, 10) },
      { id: "pb-11r", label: "11R (11″ × 14″)", hint: "27,9 × 35,6 cm", ...IN(11, 14) },
    ],
  },
];

export function getProvider(id: string): Provider | undefined {
  return providers.find((p) => p.id === id);
}

export function getFormat(providerId: string, formatId: string): PrintFormat | undefined {
  return getProvider(providerId)?.formats.find((f) => f.id === formatId);
}

/** Preset rectangles start landscape (longer side = width). Squares stay square. */
export function landscapeMm(format: PrintFormat): { widthMm: number; heightMm: number } {
  const a = format.widthMm;
  const b = format.heightMm;
  return a >= b ? { widthMm: a, heightMm: b } : { widthMm: b, heightMm: a };
}

export function isCustomFormat(id: string): boolean {
  return id === CUSTOM_FORMAT_ID;
}
