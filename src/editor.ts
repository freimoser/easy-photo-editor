import Konva from "konva";
import { getAsset } from "./assets";
import { SAFE_ZONE_MM } from "./formats";
import type { Layer, PhotoDoc, TextLayer } from "./types";
import { mmToPx } from "./units";

export type Geometry = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

type EditorHandlers = {
  onSelect: (id: string | null) => void;
  onHistoryCheckpoint: () => void;
  onGeometry: (id: string, geometry: Geometry) => void;
  onTextChange: (id: string, text: string, height: number) => void;
};

const MIN_SIZE = 8;

export class PhotoStage {
  private readonly container: HTMLDivElement;
  private readonly handlers: EditorHandlers;
  private readonly stage: Konva.Stage;
  private readonly boardLayer: Konva.Layer;
  private readonly contentLayer: Konva.Layer;
  private readonly overlayLayer: Konva.Layer;
  private readonly pageGroup: Konva.Group;
  private readonly transformer: Konva.Transformer;
  private readonly safeZone: Konva.Rect;
  private readonly pageRect: Konva.Rect;
  private readonly shadowRect: Konva.Rect;
  private interacting = false;
  private scale = 1;
  private printW = 1;
  private printH = 1;
  private pageX = 0;
  private pageY = 0;
  private pageW = 1;
  private pageH = 1;
  private doc: PhotoDoc | null = null;

  constructor(container: HTMLDivElement, handlers: EditorHandlers) {
    this.container = container;
    this.handlers = handlers;

    this.stage = new Konva.Stage({
      container,
      width: Math.max(container.clientWidth, 1),
      height: Math.max(container.clientHeight, 1),
    });

    this.boardLayer = new Konva.Layer();
    this.contentLayer = new Konva.Layer();
    this.overlayLayer = new Konva.Layer();
    this.stage.add(this.boardLayer, this.contentLayer, this.overlayLayer);

    this.shadowRect = new Konva.Rect({
      fill: "#ffffff",
      shadowColor: "rgba(0,0,0,0.45)",
      shadowBlur: 28,
      shadowOffsetY: 10,
      listening: false,
    });
    this.pageRect = new Konva.Rect({
      fill: "#ffffff",
      listening: true,
    });
    this.boardLayer.add(this.shadowRect, this.pageRect);

    this.pageGroup = new Konva.Group();
    this.contentLayer.add(this.pageGroup);

    this.safeZone = new Konva.Rect({
      stroke: "#2563eb",
      strokeWidth: 1,
      dash: [6, 4],
      listening: false,
    });
    this.overlayLayer.add(this.safeZone);

    this.transformer = new Konva.Transformer({
      rotateEnabled: true,
      keepRatio: true,
      flipEnabled: false,
      centeredScaling: false,
      ignoreStroke: true,
      padding: 8,
      shouldOverdrawWholeArea: false,
      boundBoxFunc: (oldBox, newBox) => {
        if (newBox.width < MIN_SIZE || newBox.height < MIN_SIZE) return oldBox;
        return newBox;
      },
      anchorStroke: "#2563eb",
      anchorFill: "#ffffff",
      anchorSize: 16,
      anchorCornerRadius: 3,
      borderStroke: "#2563eb",
      rotateAnchorOffset: 28,
    });
    this.overlayLayer.add(this.transformer);

    this.stage.container().style.touchAction = "none";
    this.stage.container().style.cursor = "default";

    this.stage.on("click tap", (e) => {
      if (this.interacting) return;
      const isEmpty = e.target === this.stage || e.target === this.pageRect;
      if (isEmpty) this.handlers.onSelect(null);
    });

    this.stage.on("mouseup touchend", () => {
      if (this.pageGroup.getChildren().some((n) => n.isDragging())) return;
      this.interacting = false;
    });

    this.stage.on("dblclick dbltap", (e) => {
      const id = e.target.getAttr("layerId") as string | undefined;
      if (!id || e.target.getAttr("layerType") !== "text") return;
      this.openTextEditor(id, e.target as Konva.Text);
    });
  }

  destroy(): void {
    this.stage.destroy();
  }

  resize(): void {
    const w = Math.max(this.container.clientWidth, 1);
    const h = Math.max(this.container.clientHeight, 1);
    this.stage.size({ width: w, height: h });
    if (this.doc) this.render(this.doc);
  }

  screenToPage(clientX: number, clientY: number): { x: number; y: number } | null {
    const rect = this.container.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    if (sx < this.pageX || sy < this.pageY || sx > this.pageX + this.pageW || sy > this.pageY + this.pageH) {
      return null;
    }
    return {
      x: (sx - this.pageX) / this.scale,
      y: (sy - this.pageY) / this.scale,
    };
  }

  render(doc: PhotoDoc): void {
    this.doc = doc;
    this.printW = mmToPx(doc.widthMm, doc.dpi);
    this.printH = mmToPx(doc.heightMm, doc.dpi);

    const pad = 48;
    const availW = Math.max(this.stage.width() - pad * 2, 80);
    const availH = Math.max(this.stage.height() - pad * 2, 80);
    this.scale = Math.min(availW / this.printW, availH / this.printH);
    this.pageW = this.printW * this.scale;
    this.pageH = this.printH * this.scale;
    this.pageX = (this.stage.width() - this.pageW) / 2;
    this.pageY = (this.stage.height() - this.pageH) / 2;

    this.shadowRect.setAttrs({
      x: this.pageX,
      y: this.pageY,
      width: this.pageW,
      height: this.pageH,
    });
    this.pageRect.setAttrs({
      x: this.pageX,
      y: this.pageY,
      width: this.pageW,
      height: this.pageH,
    });

    this.pageGroup.setAttrs({
      x: this.pageX,
      y: this.pageY,
    });
    this.pageGroup.setAttr("clipWidth", undefined);
    this.pageGroup.setAttr("clipHeight", undefined);
    this.pageGroup.setAttr("clipX", undefined);
    this.pageGroup.setAttr("clipY", undefined);

    const inset = mmToPx(SAFE_ZONE_MM, doc.dpi) * this.scale;
    this.safeZone.setAttrs({
      x: this.pageX + inset,
      y: this.pageY + inset,
      width: Math.max(this.pageW - inset * 2, 0),
      height: Math.max(this.pageH - inset * 2, 0),
      visible: doc.showSafeZone,
      strokeWidth: 1,
    });

    if (!this.interacting) this.syncContent(doc);
    if (!this.interacting) this.attachTransformer(doc.selectedId);
    this.boardLayer.batchDraw();
    this.contentLayer.batchDraw();
    this.overlayLayer.batchDraw();
  }

  setSelection(id: string | null): void {
    if (this.interacting) return;
    this.attachTransformer(id);
    this.overlayLayer.batchDraw();
  }

  cancelInteraction(): void {
    this.interacting = false;
  }

  /** Change z-order without recreating images (avoids stutter and ghost copies). */
  reorder(idsBottomToTop: string[]): void {
    this.interacting = false;
    this.transformer.nodes([]);
    const byId = new Map<string, Konva.Node>();
    for (const node of this.pageGroup.getChildren()) {
      const id = node.getAttr("layerId") as string | undefined;
      if (id) byId.set(id, node);
    }
    for (const id of idsBottomToTop) {
      byId.get(id)?.moveToTop();
    }
    this.attachTransformer(this.doc?.selectedId ?? null);
    this.contentLayer.batchDraw();
    this.overlayLayer.batchDraw();
  }

  private toScreen(n: number): number {
    return n * this.scale;
  }

  private toPrint(n: number): number {
    return n / this.scale;
  }

  private nodeById(): Map<string, Konva.Image | Konva.Text> {
    const map = new Map<string, Konva.Image | Konva.Text>();
    for (const node of this.pageGroup.getChildren()) {
      const id = node.getAttr("layerId") as string | undefined;
      if (id) map.set(id, node as Konva.Image | Konva.Text);
    }
    return map;
  }

  private syncContent(doc: PhotoDoc): void {
    const existing = this.nodeById();
    const kept = new Set<string>();

    for (const layer of doc.layers) {
      kept.add(layer.id);
      const current = existing.get(layer.id) ?? this.createNode(layer);
      if (!current) continue;
      if (!existing.has(layer.id)) this.pageGroup.add(current);
      else this.applyLayerToNode(current, layer);
      current.moveToTop();
    }

    for (const [id, node] of existing) {
      if (!kept.has(id)) node.destroy();
    }
  }

  private createNode(layer: Layer): Konva.Image | Konva.Text | null {
    if (layer.type === "image") {
      const asset = getAsset(layer.assetId);
      if (!asset) return null;
      const node = new Konva.Image({ image: asset.image });
      node.setAttr("layerId", layer.id);
      node.setAttr("layerType", "image");
      this.applyLayerToNode(node, layer);
      this.bindNode(node, layer.id);
      return node;
    }
    const node = new Konva.Text({ lineHeight: 1.25 });
    node.setAttr("layerId", layer.id);
    node.setAttr("layerType", "text");
    this.applyLayerToNode(node, layer);
    this.bindNode(node, layer.id);
    return node;
  }

  private applyLayerToNode(node: Konva.Image | Konva.Text, layer: Layer): void {
    node.scaleX(1);
    node.scaleY(1);
    node.setAttrs({
      x: this.toScreen(layer.x),
      y: this.toScreen(layer.y),
      width: this.toScreen(layer.width),
      rotation: layer.rotation,
      opacity: layer.opacity,
      visible: layer.visible,
      draggable: !layer.locked && layer.visible,
      offsetX: this.toScreen(layer.width) / 2,
    });
    if (node instanceof Konva.Image && layer.type === "image") {
      node.height(this.toScreen(layer.height));
      node.offsetY(this.toScreen(layer.height) / 2);
      const strokePx =
        layer.strokeWidthMm > 0 && this.doc
          ? this.toScreen(mmToPx(layer.strokeWidthMm, this.doc.dpi))
          : 0;
      node.stroke(strokePx > 0 ? layer.stroke : "");
      node.strokeWidth(strokePx);
      node.strokeScaleEnabled(false);
    } else if (layer.type === "text") {
      node.setAttrs({
        text: layer.text,
        fontSize: this.toScreen(layer.fontSize),
        fontFamily: layer.fontFamily,
        fill: layer.fill,
        align: layer.align,
      });
      node.offsetY(node.height() / 2);
    }
  }

  private bindNode(node: Konva.Image | Konva.Text, id: string): void {
    node.on("mouseenter", () => {
      const layer = this.doc?.layers.find((item) => item.id === id);
      if (layer && !layer.locked && layer.visible) this.stage.container().style.cursor = "move";
    });
    node.on("mouseleave", () => {
      this.stage.container().style.cursor = "default";
    });
    node.on("mousedown touchstart", () => {
      this.interacting = true;
      const layer = this.doc?.layers.find((item) => item.id === id);
      if (!layer || layer.locked || !layer.visible) return;
      this.handlers.onSelect(id);
    });
    node.on("dragstart transformstart", () => {
      this.interacting = true;
      this.handlers.onHistoryCheckpoint();
    });
    node.on("dragend transformend", () => {
      this.bakeScale(node);
      this.interacting = false;
      this.handlers.onGeometry(id, this.readGeometry(node));
    });
  }

  private bakeScale(node: Konva.Image | Konva.Text): void {
    const width = Math.max(node.width() * node.scaleX(), MIN_SIZE);
    const height = Math.max(node.height() * node.scaleY(), MIN_SIZE);
    node.scaleX(1);
    node.scaleY(1);
    node.width(width);
    if (node instanceof Konva.Text) {
      node.offsetX(width / 2);
      node.offsetY(node.height() / 2);
    } else {
      node.height(height);
      node.offsetX(width / 2);
      node.offsetY(height / 2);
    }
  }

  private readGeometry(node: Konva.Image | Konva.Text): Geometry {
    const width = this.toPrint(node.width());
    const height = this.toPrint(node instanceof Konva.Text ? node.height() : node.height());
    return {
      x: this.toPrint(node.x()),
      y: this.toPrint(node.y()),
      width,
      height,
      rotation: node.rotation(),
    };
  }

  private attachTransformer(selectedId: string | null): void {
    const current = this.transformer.nodes()[0];
    if (selectedId && current?.getAttr("layerId") === selectedId && current.getLayer()) return;

    if (!selectedId) {
      this.transformer.nodes([]);
      return;
    }
    const node = this.pageGroup.findOne((n: Konva.Node) => n.getAttr("layerId") === selectedId);
    if (!node || !node.visible() || node.getAttr("draggable") === false) {
      this.transformer.nodes([]);
      return;
    }
    const isText = node.getAttr("layerType") === "text";
    this.transformer.keepRatio(!isText);
    this.transformer.enabledAnchors(
      isText
        ? ["middle-left", "middle-right"]
        : [
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "middle-left",
            "middle-right",
            "top-center",
            "bottom-center",
          ],
    );
    this.transformer.nodes([node]);
  }

  private openTextEditor(id: string, node: Konva.Text): void {
    const textarea = document.createElement("textarea");
    const box = this.container.getBoundingClientRect();
    const abs = node.getClientRect({ skipShadow: true, skipStroke: true });
    textarea.value = node.text();
    Object.assign(textarea.style, {
      position: "fixed",
      left: `${box.left + abs.x}px`,
      top: `${box.top + abs.y}px`,
      width: `${Math.max(abs.width, 80)}px`,
      height: `${Math.max(abs.height, 32)}px`,
      font: `${node.fontSize()}px ${node.fontFamily()}`,
      color: node.fill() as string,
      lineHeight: "1.25",
      textAlign: node.align(),
      border: "1px solid #2563eb",
      padding: "2px 4px",
      margin: "0",
      overflow: "hidden",
      background: "rgba(255,255,255,0.96)",
      outline: "none",
      resize: "none",
      zIndex: "20",
    } as CSSStyleDeclaration);
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    node.hide();
    this.transformer.nodes([]);
    this.overlayLayer.batchDraw();

    const finish = () => {
      textarea.removeEventListener("blur", finish);
      textarea.removeEventListener("keydown", onKey);
      const next = textarea.value;
      textarea.remove();
      node.show();
      this.handlers.onTextChange(id, next, this.toPrint(node.height()));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        textarea.value = node.text();
        finish();
      }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        finish();
      }
    };
    textarea.addEventListener("blur", finish);
    textarea.addEventListener("keydown", onKey);
  }
}

export function fitImageToPage(
  imgW: number,
  imgH: number,
  pageW: number,
  pageH: number,
  fill = 0.86,
): { width: number; height: number } {
  const scale = Math.min((pageW * fill) / imgW, (pageH * fill) / imgH);
  return { width: imgW * scale, height: imgH * scale };
}

/** Scale a layer so its rotated bounding box fills the page (contain). */
export function fitRotatedToPage(
  width: number,
  height: number,
  rotationDeg: number,
  pageW: number,
  pageH: number,
): { width: number; height: number } {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const boundW = width * cos + height * sin;
  const boundH = width * sin + height * cos;
  if (boundW < 1 || boundH < 1) return { width, height };
  const scale = Math.min(pageW / boundW, pageH / boundH);
  return { width: width * scale, height: height * scale };
}

export function defaultTextLayer(pageW: number, pageH: number): Omit<TextLayer, "id"> {
  const fontSize = Math.round(pageH * 0.08);
  const width = pageW * 0.72;
  const height = fontSize * 1.25;
  return {
    type: "text",
    name: "Text",
    visible: true,
    locked: false,
    opacity: 1,
    x: pageW / 2,
    y: pageH / 2,
    width,
    height,
    rotation: 0,
    keep: false,
    text: "Dein Text",
    fontSize,
    fontFamily: "Inter, system-ui, sans-serif",
    fill: "#1c1b19",
    align: "center",
  };
}
