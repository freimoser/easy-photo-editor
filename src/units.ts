export type LengthUnit = "mm" | "cm" | "in" | "px";

export const UNIT_OPTIONS: { id: LengthUnit; label: string }[] = [
  { id: "cm", label: "cm" },
  { id: "mm", label: "mm" },
  { id: "in", label: "Zoll (in)" },
  { id: "px", label: "Pixel" },
];

export function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi);
}

export function pxToMm(px: number, dpi: number): number {
  return (px / dpi) * 25.4;
}

export function toMm(value: number, unit: LengthUnit, dpi: number): number {
  switch (unit) {
    case "mm":
      return value;
    case "cm":
      return value * 10;
    case "in":
      return value * 25.4;
    case "px":
      return (value / dpi) * 25.4;
  }
}

export function fromMm(mm: number, unit: LengthUnit, dpi: number): number {
  switch (unit) {
    case "mm":
      return mm;
    case "cm":
      return mm / 10;
    case "in":
      return mm / 25.4;
    case "px":
      return (mm / 25.4) * dpi;
  }
}

export function roundNice(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (Math.abs(n) >= 100) return Math.round(n * 10) / 10;
  if (Math.abs(n) >= 10) return Math.round(n * 100) / 100;
  return Math.round(n * 1000) / 1000;
}

export function unitSuffix(unit: LengthUnit): string {
  if (unit === "in") return "in";
  if (unit === "px") return "px";
  return unit;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['″]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function timestampForFile(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}
