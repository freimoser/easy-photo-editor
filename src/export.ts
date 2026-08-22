import { getAsset } from "./assets";
import type { PhotoDoc, TextLayer } from "./types";
import { mmToPx, slugify, timestampForFile } from "./units";

export type ExportKind = "jpeg" | "png";

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const paragraphs = text.split("\n");
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push("");
      continue;
    }
    const words = paragraph.split(/\s+/);
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth || !current) {
        current = next;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines.length ? lines : [""];
}

function drawText(ctx: CanvasRenderingContext2D, layer: TextLayer): void {
  ctx.font = `${layer.fontSize}px ${layer.fontFamily}`;
  ctx.fillStyle = layer.fill;
  ctx.textBaseline = "top";
  ctx.textAlign = layer.align;
  const lines = wrapLines(ctx, layer.text, layer.width);
  const lineHeight = layer.fontSize * 1.25;
  const blockH = Math.max(lines.length * lineHeight, lineHeight);
  let x = -layer.width / 2;
  if (layer.align === "center") x = 0;
  if (layer.align === "right") x = layer.width / 2;
  let y = -blockH / 2;
  for (const line of lines) {
    ctx.fillText(line, x, y, layer.width);
    y += lineHeight;
  }
}

export async function exportDocument(
  doc: PhotoDoc,
  kind: ExportKind,
): Promise<{ blob: Blob; filename: string }> {
  const width = mmToPx(doc.widthMm, doc.dpi);
  const height = mmToPx(doc.heightMm, doc.dpi);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar");

  await document.fonts.ready;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  for (const layer of doc.layers) {
    if (!layer.visible) continue;
    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.translate(layer.x, layer.y);
    ctx.rotate((layer.rotation * Math.PI) / 180);

    if (layer.type === "image") {
      const asset = getAsset(layer.assetId);
      if (asset) {
        ctx.drawImage(
          asset.image,
          -layer.width / 2,
          -layer.height / 2,
          layer.width,
          layer.height,
        );
      }
      if (layer.strokeWidthMm > 0) {
        ctx.strokeStyle = layer.stroke;
        ctx.lineWidth = mmToPx(layer.strokeWidthMm, doc.dpi);
        ctx.strokeRect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
      }
    } else {
      drawText(ctx, layer);
    }
    ctx.restore();
  }

  const mime = kind === "png" ? "image/png" : "image/jpeg";
  const quality = kind === "jpeg" ? 0.92 : undefined;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Export fehlgeschlagen"))),
      mime,
      quality,
    );
  });

  const ext = kind === "png" ? "png" : "jpg";
  const filename = `${slugify(doc.providerName)}-${slugify(doc.formatLabel)}-${timestampForFile()}.${ext}`;
  return { blob, filename };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
