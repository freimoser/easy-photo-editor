export type ImageLayer = {
  id: string;
  type: "image";
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  /** Center X in print pixels */
  x: number;
  /** Center Y in print pixels */
  y: number;
  width: number;
  height: number;
  rotation: number;
  assetId: string;
  keep: boolean;
  stroke: string;
  strokeWidthMm: number;
};

export type TextLayer = {
  id: string;
  type: "text";
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  align: "left" | "center" | "right";
  keep: boolean;
};

export type Layer = ImageLayer | TextLayer;

export type PhotoDoc = {
  providerId: string;
  providerName: string;
  formatId: string;
  formatLabel: string;
  widthMm: number;
  heightMm: number;
  dpi: number;
  layers: Layer[];
  selectedId: string | null;
  showSafeZone: boolean;
  autoResize: boolean;
};

export const FONT_CHOICES = [
  { id: "Inter, system-ui, sans-serif", label: "Inter" },
  { id: "Georgia, serif", label: "Georgia" },
  { id: "Times New Roman, Times, serif", label: "Times" },
  { id: "Arial, Helvetica, sans-serif", label: "Arial" },
  { id: "Impact, Haettenschweiler, sans-serif", label: "Impact" },
  { id: "Courier New, Courier, monospace", label: "Courier" },
] as const;
