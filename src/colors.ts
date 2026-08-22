export const COLOR_PRESETS: { hex: string; label: string }[] = [
  { hex: "#000000", label: "Schwarz" },
  { hex: "#434343", label: "Dunkelgrau" },
  { hex: "#666666", label: "Grau" },
  { hex: "#999999", label: "Hellgrau" },
  { hex: "#cccccc", label: "Silber" },
  { hex: "#ffffff", label: "Weiß" },
  { hex: "#980000", label: "Dunkelrot" },
  { hex: "#ff0000", label: "Rot" },
  { hex: "#ff9900", label: "Orange" },
  { hex: "#ffff00", label: "Gelb" },
  { hex: "#00ff00", label: "Hellgrün" },
  { hex: "#00ffff", label: "Cyan" },
  { hex: "#4a86e8", label: "Blau" },
  { hex: "#0000ff", label: "Königsblau" },
  { hex: "#9900ff", label: "Violett" },
  { hex: "#ff00ff", label: "Magenta" },
  { hex: "#e69138", label: "Ocker" },
  { hex: "#6aa84f", label: "Grün" },
  { hex: "#3d85c6", label: "Stahlblau" },
  { hex: "#a64d79", label: "Beere" },
  { hex: "#7f6000", label: "Braun" },
  { hex: "#274e13", label: "Tannengrün" },
  { hex: "#0b5394", label: "Marine" },
  { hex: "#351c75", label: "Indigo" },
];

export function swatchStackHtml(current: string): string {
  const active = current.toLowerCase();
  return `<div class="swatch-stack" role="list">${COLOR_PRESETS.map((c) => {
    const selected = c.hex === active ? " selected" : "";
    return `<button type="button" class="swatch${selected}" data-color="${c.hex}" title="${c.label}" style="background:${c.hex}"></button>`;
  }).join("")}</div>`;
}
