import "./style.css";
import { clearAssets, forgetAsset, loadImageFile, pruneAssets } from "./assets";
import { swatchStackHtml } from "./colors";
import {
  defaultTextLayer,
  fitImageToPage,
  fitRotatedToPage,
  PhotoStage,
  type Geometry,
} from "./editor";
import { downloadBlob, exportDocument } from "./export";
import {
  CUSTOM_FORMAT_ID,
  DPI,
  getFormat,
  getProvider,
  isCustomFormat,
  landscapeMm,
  MAX_EXPORT_PX,
  MIN_SIDE_MM,
  providers,
  type PrintFormat,
} from "./formats";
import { HistoryStack } from "./history";
import type { ImageLayer, Layer, PhotoDoc, TextLayer } from "./types";
import {
  fromMm,
  mmToPx,
  roundNice,
  toMm,
  unitSuffix,
  type LengthUnit,
} from "./units";

const setupEl = document.querySelector<HTMLDivElement>("#setup")!;
const editorEl = document.querySelector<HTMLDivElement>("#editor")!;
const providerList = document.querySelector<HTMLDivElement>("#provider-list")!;
const providerBlurb = document.querySelector<HTMLParagraphElement>("#provider-blurb")!;
const formatList = document.querySelector<HTMLDivElement>("#format-list")!;
const startBtn = document.querySelector<HTMLButtonElement>("#start-btn")!;
const stageHost = document.querySelector<HTMLDivElement>("#stage")!;
const workspace = document.querySelector<HTMLDivElement>("#workspace")!;
const layerList = document.querySelector<HTMLUListElement>("#layer-list")!;
const propsEl = document.querySelector<HTMLDivElement>("#props")!;
const docTitle = document.querySelector<HTMLElement>("#doc-title")!;
const docMeta = document.querySelector<HTMLElement>("#doc-meta")!;
const toastEl = document.querySelector<HTMLDivElement>("#toast")!;

const btnSafe = document.querySelector<HTMLButtonElement>("#btn-safe")!;
const btnAutoResize = document.querySelector<HTMLButtonElement>("#btn-autoresize")!;
const btnUndo = document.querySelector<HTMLButtonElement>("#btn-undo")!;
const btnRedo = document.querySelector<HTMLButtonElement>("#btn-redo")!;
const btnImages = document.querySelector<HTMLButtonElement>("#btn-images")!;
const fileInput = document.querySelector<HTMLInputElement>("#file-input")!;
const btnText = document.querySelector<HTMLButtonElement>("#btn-text")!;
const btnJpeg = document.querySelector<HTMLButtonElement>("#btn-jpeg")!;
const btnPng = document.querySelector<HTMLButtonElement>("#btn-png")!;
const btnNew = document.querySelector<HTMLButtonElement>("#btn-new")!;
const btnSame = document.querySelector<HTMLButtonElement>("#btn-same")!;
const customW = document.querySelector<HTMLInputElement>("#custom-w")!;
const customH = document.querySelector<HTMLInputElement>("#custom-h")!;
const customUnitEl = document.querySelector<HTMLSelectElement>("#custom-unit")!;
const customDpiEl = document.querySelector<HTMLInputElement>("#custom-dpi")!;
const customSwap = document.querySelector<HTMLButtonElement>("#custom-swap")!;
const customPreview = document.querySelector<HTMLParagraphElement>("#custom-preview")!;

let providerId = providers[0].id;
let formatId = providers[0].formats[1]?.id ?? providers[0].formats[0].id;
let lastCustomUnit: LengthUnit = "cm";
let autoResizeDefault = true;
let keptTemplate: { layers: Layer[]; pageW: number; pageH: number } | null = null;
let doc: PhotoDoc | null = null;
const history = new HistoryStack();
let stage: PhotoStage | null = null;
let toastTimer = 0;

function toast(message: string): void {
  toastEl.textContent = message;
  toastEl.classList.remove("hidden");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.add("hidden"), 2400);
}

function cloneLayers(layers: Layer[]): Layer[] {
  return JSON.parse(JSON.stringify(layers)) as Layer[];
}

function checkpoint(): void {
  if (!doc) return;
  history.push(cloneLayers(doc.layers));
  syncChrome();
}

function pageSize(current: PhotoDoc): { w: number; h: number } {
  return { w: mmToPx(current.widthMm, current.dpi), h: mmToPx(current.heightMm, current.dpi) };
}

function selected(): Layer | undefined {
  return doc?.layers.find((l) => l.id === doc?.selectedId);
}

function paperThumb(ratio: number): string {
  const thumbW = ratio >= 1 ? 44 : 44 * ratio;
  const thumbH = ratio >= 1 ? 44 / ratio : 44;
  return `<div class="paper-thumb"><i style="width:${thumbW}px;height:${thumbH}px"></i></div>`;
}

function readNumber(input: HTMLInputElement): number {
  return Number(String(input.value).replace(",", "."));
}

function parseCustom():
  | { ok: true; widthMm: number; heightMm: number; dpi: number; label: string; hint: string }
  | { ok: false; error: string } {
  const unit = customUnitEl.value as LengthUnit;
  const dpi = readNumber(customDpiEl);
  const w = readNumber(customW);
  const h = readNumber(customH);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return { ok: false, error: "Bitte Breite und Höhe größer als 0 eingeben." };
  }
  if (!Number.isFinite(dpi) || dpi < 72 || dpi > 600) {
    return { ok: false, error: "DPI muss zwischen 72 und 600 liegen." };
  }
  const widthMm = toMm(w, unit, dpi);
  const heightMm = toMm(h, unit, dpi);
  if (widthMm < MIN_SIDE_MM || heightMm < MIN_SIDE_MM) {
    return { ok: false, error: "Zu klein — mindestens 5 mm pro Seite." };
  }
  const pxW = mmToPx(widthMm, dpi);
  const pxH = mmToPx(heightMm, dpi);
  if (pxW > MAX_EXPORT_PX || pxH > MAX_EXPORT_PX) {
    return { ok: false, error: `Zu groß — max. ${MAX_EXPORT_PX} px pro Seite.` };
  }
  const cmW = roundNice(widthMm / 10);
  const cmH = roundNice(heightMm / 10);
  return {
    ok: true,
    widthMm,
    heightMm,
    dpi,
    label: `${roundNice(w)} × ${roundNice(h)} ${unitSuffix(unit)}`,
    hint: `${pxW} × ${pxH} px · ${cmW} × ${cmH} cm · ${dpi} DPI`,
  };
}

function updateCustomPreview(): void {
  const parsed = parseCustom();
  customPreview.textContent = parsed.ok ? parsed.hint : parsed.error;
}

function renderSetup(): void {
  const provider = getProvider(providerId)!;
  providerBlurb.textContent = provider.blurb;
  providerList.innerHTML = "";
  for (const p of providers) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `choice${p.id === providerId ? " active" : ""}`;
    btn.innerHTML = `<strong>${p.name}</strong><span>${p.formats.length} Formate</span>`;
    btn.addEventListener("click", () => {
      providerId = p.id;
      if (!isCustomFormat(formatId)) formatId = p.formats[0].id;
      renderSetup();
    });
    providerList.appendChild(btn);
  }

  formatList.innerHTML = "";
  for (const format of provider.formats) {
    const land = landscapeMm(format);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `choice${format.id === formatId ? " active" : ""}`;
    btn.innerHTML = `${paperThumb(land.widthMm / land.heightMm)}<strong>${format.label}</strong><span>${format.hint}</span>`;
    btn.addEventListener("click", () => {
      formatId = format.id;
      renderSetup();
    });
    formatList.appendChild(btn);
  }

  const parsed = parseCustom();
  const customRatio = parsed.ok ? parsed.widthMm / parsed.heightMm : 1.5;
  const customBtn = document.createElement("button");
  customBtn.type = "button";
  customBtn.className = `choice${isCustomFormat(formatId) ? " active" : ""}`;
  customBtn.innerHTML = `${paperThumb(customRatio)}<strong>Eigenes Maß</strong><span>${parsed.ok ? parsed.label : "cm, mm, Zoll, Pixel"}</span>`;
  customBtn.addEventListener("click", () => {
    formatId = CUSTOM_FORMAT_ID;
    renderSetup();
  });
  formatList.appendChild(customBtn);
  updateCustomPreview();
}

function startDocument(
  format: PrintFormat,
  providerName: string,
  opts?: { dpi?: number; keepOrientation?: boolean },
): PhotoDoc {
  const size = opts?.keepOrientation
    ? { widthMm: format.widthMm, heightMm: format.heightMm }
    : landscapeMm(format);
  return {
    providerId,
    providerName,
    formatId: format.id,
    formatLabel: format.label,
    widthMm: size.widthMm,
    heightMm: size.heightMm,
    dpi: opts?.dpi ?? DPI,
    layers: [],
    selectedId: null,
    showSafeZone: true,
    autoResize: autoResizeDefault,
  };
}

function openEditor(): void {
  const provider = getProvider(providerId);
  if (!provider) return;

  let format: PrintFormat | undefined;
  let dpi = DPI;
  let keepOrientation = false;
  if (isCustomFormat(formatId)) {
    const parsed = parseCustom();
    if (!parsed.ok) {
      toast(parsed.error);
      return;
    }
    format = {
      id: CUSTOM_FORMAT_ID,
      label: parsed.label,
      hint: parsed.hint,
      widthMm: parsed.widthMm,
      heightMm: parsed.heightMm,
    };
    dpi = parsed.dpi;
    keepOrientation = true;
  } else {
    format = getFormat(providerId, formatId);
  }
  if (!format) return;

  history.clear();
  doc = startDocument(format, isCustomFormat(formatId) ? "Custom" : provider.name, {
    dpi,
    keepOrientation,
  });
  if (keptTemplate) {
    doc.layers = scaleKeptLayers(keptTemplate.layers, keptTemplate.pageW, keptTemplate.pageH, pageSize(doc).w, pageSize(doc).h);
    pruneAssets(usedAssetIds(doc.layers));
  } else {
    clearAssets();
  }
  setupEl.classList.add("hidden");
  editorEl.classList.remove("hidden");
  if (!stage) {
    stage = new PhotoStage(stageHost, {
      onSelect: (id) => {
        if (!doc) return;
        if (doc.selectedId === id) return;
        doc.selectedId = id;
        renderLayers();
        renderProps();
        stage?.setSelection(id);
      },
      onHistoryCheckpoint: checkpoint,
      onGeometry: (id, geometry) => applyGeometry(id, geometry),
      onTextChange: (id, text) => applyText(id, text),
    });
  }
  requestAnimationFrame(() => {
    stage?.resize();
    paint();
  });
}

function usedAssetIds(layers: Layer[]): string[] {
  return layers.filter((layer): layer is ImageLayer => layer.type === "image").map((layer) => layer.assetId);
}

function scaleKeptLayers(
  layers: Layer[],
  fromW: number,
  fromH: number,
  toW: number,
  toH: number,
): Layer[] {
  const sx = toW / fromW;
  const sy = toH / fromH;
  const s = Math.min(sx, sy);
  return cloneLayers(layers).map((layer) => {
    layer.x *= sx;
    layer.y *= sy;
    layer.width *= s;
    layer.height *= s;
    if (layer.type === "text") layer.fontSize = Math.max(12, layer.fontSize * s);
    return layer;
  });
}

function rememberKeptLayers(): void {
  if (!doc) {
    keptTemplate = null;
    return;
  }
  const kept = doc.layers.filter((layer) => layer.keep);
  if (kept.length === 0) {
    keptTemplate = null;
    return;
  }
  const { w, h } = pageSize(doc);
  keptTemplate = { layers: cloneLayers(kept), pageW: w, pageH: h };
}

function confirmDiscardUnpinned(): boolean {
  if (!doc) return true;
  const unpinned = doc.layers.filter((layer) => !layer.keep);
  if (unpinned.length === 0) return true;
  const kept = doc.layers.length - unpinned.length;
  const message = kept
    ? `${unpinned.length} Ebenen verwerfen? ${kept} markierte bleiben.`
    : "Aktuelles Foto verwerfen und neu starten?";
  return window.confirm(message);
}

function closeEditor(): void {
  if (doc && doc.layers.some((layer) => !layer.keep) && !confirmDiscardUnpinned()) return;
  rememberKeptLayers();
  history.clear();
  if (keptTemplate) pruneAssets(usedAssetIds(keptTemplate.layers));
  else clearAssets();
  doc = null;
  editorEl.classList.add("hidden");
  setupEl.classList.remove("hidden");
}

function newPhotoSameSettings(): void {
  if (!doc) return;
  if (doc.layers.some((layer) => !layer.keep) && !confirmDiscardUnpinned()) return;
  const kept = doc.layers.filter((layer) => layer.keep);
  const next: PhotoDoc = {
    providerId: doc.providerId,
    providerName: doc.providerName,
    formatId: doc.formatId,
    formatLabel: doc.formatLabel,
    widthMm: doc.widthMm,
    heightMm: doc.heightMm,
    dpi: doc.dpi,
    layers: cloneLayers(kept),
    selectedId: kept.at(-1)?.id ?? null,
    showSafeZone: doc.showSafeZone,
    autoResize: doc.autoResize,
  };
  history.clear();
  pruneAssets(usedAssetIds(next.layers));
  doc = next;
  stage?.cancelInteraction();
  paint();
  toast(kept.length ? `Gleiches Format, ${kept.length} Ebenen behalten` : "Gleiches Format, leere Fläche");
}

function autoFitImage(layer: ImageLayer): void {
  if (!doc?.autoResize) return;
  const { w, h } = pageSize(doc);
  const fitted = fitRotatedToPage(layer.width, layer.height, layer.rotation, w, h);
  layer.width = fitted.width;
  layer.height = fitted.height;
  layer.x = w / 2;
  layer.y = h / 2;
}

function applyGeometry(id: string, geometry: Geometry): void {
  if (!doc) return;
  const layer = doc.layers.find((l) => l.id === id);
  if (!layer) return;
  layer.x = geometry.x;
  layer.y = geometry.y;
  layer.width = geometry.width;
  layer.height = geometry.height;
  layer.rotation = geometry.rotation;
  paint();
}

function applyText(id: string, text: string): void {
  if (!doc) return;
  const layer = doc.layers.find((l) => l.id === id);
  if (!layer || layer.type !== "text") return;
  if (layer.text === text) {
    paint();
    return;
  }
  checkpoint();
  layer.text = text;
  layer.name = text.trim().slice(0, 24) || "Text";
  paint();
}

function paint(): void {
  if (!doc || !stage) return;
  stage.cancelInteraction();
  stage.render(doc);
  syncChrome();
  renderLayers();
  renderProps();
}

function syncChrome(): void {
  if (!doc) return;
  const w = mmToPx(doc.widthMm, doc.dpi);
  const h = mmToPx(doc.heightMm, doc.dpi);
  docTitle.textContent = `${doc.providerName} · ${doc.formatLabel}`;
  docMeta.textContent = `${Math.round(doc.widthMm)} × ${Math.round(doc.heightMm)} mm · ${w} × ${h} px · ${doc.dpi} DPI`;
  btnSafe.setAttribute("aria-pressed", String(doc.showSafeZone));
  btnAutoResize.setAttribute("aria-pressed", String(doc.autoResize));
  btnUndo.disabled = !history.canUndo;
  btnRedo.disabled = !history.canRedo;
}

function iconButton(title: string, text: string, onClick: () => void, disabled = false): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.title = title;
  btn.textContent = text;
  btn.disabled = disabled;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
}

function renderLayers(): void {
  if (!doc) return;
  layerList.innerHTML = "";
  if (doc.layers.length === 0) {
    const empty = document.createElement("li");
    empty.className = "layer-item";
    empty.innerHTML = `<span class="layer-handle"></span><span class="layer-name">Noch leer. Bild einfügen oder Text anlegen.</span>`;
    layerList.appendChild(empty);
    return;
  }
  const reversed = [...doc.layers].reverse();
  reversed.forEach((layer, visualIndex) => {
    const li = document.createElement("li");
    li.className = `layer-item${layer.id === doc!.selectedId ? " active" : ""}${layer.visible ? "" : " hidden-layer"}${layer.keep ? " kept" : ""}`;
    li.draggable = true;
    li.dataset.id = layer.id;

    const handle = document.createElement("span");
    handle.className = "layer-handle";
    handle.title = "Ziehen zum Sortieren";
    handle.textContent = "⋮⋮";

    const name = document.createElement("span");
    name.className = "layer-name";
    name.textContent = `${layer.type === "text" ? "Aa" : "▣"} ${layer.name}`;

    const up = iconButton("Nach vorne", "↑", () => moveLayerById(layer.id, 1), visualIndex === 0);
    const down = iconButton(
      "Nach hinten",
      "↓",
      () => moveLayerById(layer.id, -1),
      visualIndex === reversed.length - 1,
    );
    const pin = iconButton(
      layer.keep ? "Nicht mehr behalten" : "Bei neuem Foto behalten",
      layer.keep ? "★" : "☆",
      () => {
        checkpoint();
        layer.keep = !layer.keep;
        paint();
      },
    );
    const vis = iconButton(layer.visible ? "Ausblenden" : "Einblenden", layer.visible ? "●" : "○", () => {
      checkpoint();
      layer.visible = !layer.visible;
      if (!layer.visible && doc?.selectedId === layer.id) doc.selectedId = null;
      paint();
    });
    const lock = iconButton(layer.locked ? "Entsperren" : "Sperren", layer.locked ? "🔒" : "🔓", () => {
      checkpoint();
      layer.locked = !layer.locked;
      paint();
    });

    li.append(handle, name, pin, up, down, vis, lock);
    li.addEventListener("click", () => {
      if (!doc) return;
      if (doc.selectedId === layer.id) return;
      doc.selectedId = layer.id;
      renderLayers();
      renderProps();
      stage?.setSelection(layer.id);
    });
    li.addEventListener("dragstart", (e) => {
      const origin = e.target as HTMLElement;
      if (!origin.closest(".layer-handle")) {
        e.preventDefault();
        return;
      }
      e.dataTransfer?.setData("text/plain", layer.id);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
      li.classList.add("dragging");
    });
    li.addEventListener("dragend", () => li.classList.remove("dragging"));
    li.addEventListener("dragover", (e) => {
      const types = [...(e.dataTransfer?.types ?? [])];
      if (types.includes("Files")) return;
      e.preventDefault();
      li.classList.add("drag-over");
    });
    li.addEventListener("dragleave", () => li.classList.remove("drag-over"));
    li.addEventListener("drop", (e) => {
      const types = [...(e.dataTransfer?.types ?? [])];
      if (types.includes("Files")) return;
      e.preventDefault();
      li.classList.remove("drag-over");
      const fromId = e.dataTransfer?.getData("text/plain");
      if (fromId) reorderByVisualTarget(fromId, layer.id);
    });
    layerList.appendChild(li);
  });
}

function renderProps(): void {
  const layer = selected();
  if (!layer || !doc) {
    propsEl.classList.add("hidden");
    propsEl.innerHTML = "";
    return;
  }
  propsEl.classList.remove("hidden");
  const index = doc.layers.findIndex((l) => l.id === layer.id);
  const canUp = index < doc.layers.length - 1;
  const canDown = index > 0;

  const imageControls =
    layer.type === "image"
      ? `
        <p class="prop-label">Drehen</p>
        <div class="prop-rotate">
          <button class="btn ghost" id="rot-left" type="button" title="90° nach links">↺ 90°</button>
          <button class="btn ghost" id="rot-180" type="button" title="180°">180°</button>
          <button class="btn ghost" id="rot-right" type="button" title="90° nach rechts">90° ↻</button>
        </div>
        <label class="prop-row">Deckkraft
          <input id="prop-opacity" type="range" min="0" max="100" value="${Math.round(layer.opacity * 100)}" />
        </label>
        <p class="prop-label">Umrandung</p>
        <label class="prop-row">Stärke
          <select id="stroke-width">
            <option value="0" ${layer.strokeWidthMm === 0 ? "selected" : ""}>Keine</option>
            <option value="0.35" ${layer.strokeWidthMm === 0.35 ? "selected" : ""}>Haarlinie</option>
            <option value="0.5" ${layer.strokeWidthMm === 0.5 ? "selected" : ""}>0,5 mm</option>
            <option value="1" ${layer.strokeWidthMm === 1 ? "selected" : ""}>1 mm</option>
            <option value="1.5" ${layer.strokeWidthMm === 1.5 ? "selected" : ""}>1,5 mm</option>
            <option value="2" ${layer.strokeWidthMm === 2 ? "selected" : ""}>2 mm</option>
            <option value="3" ${layer.strokeWidthMm === 3 ? "selected" : ""}>3 mm</option>
            <option value="5" ${layer.strokeWidthMm === 5 ? "selected" : ""}>5 mm</option>
          </select>
        </label>
        ${swatchStackHtml(toHex(layer.stroke))}
        <div class="stroke-color">
          <label class="color-chip" title="Linienfarbe">
            <input id="stroke-color" type="color" value="${toHex(layer.stroke)}" />
          </label>
          <input id="stroke-hex" type="text" value="${toHex(layer.stroke)}" maxlength="7" spellcheck="false" aria-label="Farbcode" />
        </div>`
      : "";

  const textControls =
    layer.type === "text"
      ? `
        <p class="prop-label">Text</p>
        <div class="prop-rotate">
          <button class="btn ghost" id="text-smaller" type="button">A−</button>
          <button class="btn ghost" id="text-bigger" type="button">A+</button>
          <label class="color-chip" title="Farbe">
            <input id="prop-fill" type="color" value="${toHex(layer.fill)}" />
          </label>
        </div>
        ${swatchStackHtml(toHex(layer.fill))}
        <p class="prop-hint">Doppelklick auf den Text zum Schreiben.</p>`
      : "";

  propsEl.innerHTML = `
    <h3>${layer.name}</h3>
    ${imageControls}
    ${textControls}
    <div class="prop-actions">
      <button class="btn ghost" id="prop-up" ${canUp ? "" : "disabled"}>Nach vorne</button>
      <button class="btn ghost" id="prop-down" ${canDown ? "" : "disabled"}>Nach hinten</button>
      <button class="btn ghost" id="prop-dup">Duplizieren</button>
      <button class="btn danger-ghost" id="prop-del">Löschen</button>
    </div>
  `;

  propsEl.querySelector("#rot-left")?.addEventListener("click", () => rotateSelected(-90));
  propsEl.querySelector("#rot-180")?.addEventListener("click", () => rotateSelected(180));
  propsEl.querySelector("#rot-right")?.addEventListener("click", () => rotateSelected(90));
  propsEl.querySelector("#prop-opacity")?.addEventListener("change", (e) => {
    checkpoint();
    layer.opacity = Number((e.target as HTMLInputElement).value) / 100;
    paint();
  });
  propsEl.querySelector("#stroke-width")?.addEventListener("change", (e) => {
    if (layer.type !== "image") return;
    checkpoint();
    layer.strokeWidthMm = Number((e.target as HTMLSelectElement).value);
    paint();
  });
  propsEl.querySelector("#stroke-color")?.addEventListener("input", (e) => {
    if (layer.type !== "image") return;
    layer.stroke = (e.target as HTMLInputElement).value;
    const hex = propsEl.querySelector<HTMLInputElement>("#stroke-hex");
    if (hex) hex.value = layer.stroke;
    if (doc) stage?.render(doc);
  });
  propsEl.querySelector("#stroke-color")?.addEventListener("change", () => {
    if (layer.type !== "image") return;
    checkpoint();
    paint();
  });
  propsEl.querySelectorAll<HTMLButtonElement>(".swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      const hex = btn.dataset.color;
      if (!hex) return;
      checkpoint();
      if (layer.type === "image") {
        layer.stroke = hex;
        if (layer.strokeWidthMm === 0) layer.strokeWidthMm = 1;
      } else {
        layer.fill = hex;
      }
      paint();
    });
  });
  propsEl.querySelector("#stroke-hex")?.addEventListener("change", (e) => {
    if (layer.type !== "image") return;
    const parsed = parseHex((e.target as HTMLInputElement).value);
    if (!parsed) {
      (e.target as HTMLInputElement).value = toHex(layer.stroke);
      return;
    }
    checkpoint();
    layer.stroke = parsed;
    paint();
  });
  propsEl.querySelector("#text-smaller")?.addEventListener("click", () => bumpTextSize(1 / 1.15));
  propsEl.querySelector("#text-bigger")?.addEventListener("click", () => bumpTextSize(1.15));
  propsEl.querySelector("#prop-fill")?.addEventListener("change", (e) => {
    if (layer.type !== "text") return;
    checkpoint();
    layer.fill = (e.target as HTMLInputElement).value;
    paint();
  });
  propsEl.querySelector("#prop-up")?.addEventListener("click", () => moveLayer(1));
  propsEl.querySelector("#prop-down")?.addEventListener("click", () => moveLayer(-1));
  propsEl.querySelector("#prop-dup")?.addEventListener("click", duplicateSelected);
  propsEl.querySelector("#prop-del")?.addEventListener("click", deleteSelected);
}

function rotateSelected(degrees: number): void {
  const layer = selected();
  if (!layer) return;
  checkpoint();
  layer.rotation = ((layer.rotation + degrees) % 360 + 360) % 360;
  if (layer.type === "image" && !layer.locked) autoFitImage(layer);
  paint();
}

function bumpTextSize(factor: number): void {
  const layer = selected();
  if (!layer || layer.type !== "text") return;
  checkpoint();
  layer.fontSize = Math.min(480, Math.max(20, Math.round(layer.fontSize * factor)));
  paint();
}

function toHex(color: string): string {
  if (color.startsWith("#") && color.length === 7) return color;
  return "#1c1b19";
}

function parseHex(value: string): string | null {
  let raw = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    raw = raw
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  return null;
}

function moveLayer(delta: number): void {
  if (!doc?.selectedId) return;
  moveLayerById(doc.selectedId, delta);
}

function applyLayerOrder(): void {
  if (!doc) return;
  stage?.cancelInteraction();
  stage?.reorder(doc.layers.map((layer) => layer.id));
  renderLayers();
  renderProps();
}

function moveLayerById(id: string, delta: number): void {
  if (!doc) return;
  const i = doc.layers.findIndex((l) => l.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= doc.layers.length) return;
  checkpoint();
  const [item] = doc.layers.splice(i, 1);
  doc.layers.splice(j, 0, item);
  applyLayerOrder();
}

function reorderByVisualTarget(fromId: string, targetId: string): void {
  if (!doc || fromId === targetId) return;
  const visual = [...doc.layers].reverse();
  const from = visual.findIndex((l) => l.id === fromId);
  const to = visual.findIndex((l) => l.id === targetId);
  if (from < 0 || to < 0) return;
  checkpoint();
  const [item] = visual.splice(from, 1);
  visual.splice(to, 0, item);
  doc.layers = visual.reverse();
  applyLayerOrder();
}

function duplicateSelected(): void {
  const layer = selected();
  if (!doc || !layer) return;
  checkpoint();
  const copy = { ...JSON.parse(JSON.stringify(layer)), id: crypto.randomUUID() } as Layer;
  copy.x += 36;
  copy.y += 36;
  copy.name = `${layer.name} Kopie`;
  copy.keep = false;
  doc.layers.push(copy);
  doc.selectedId = copy.id;
  paint();
}

function deleteSelected(): void {
  const layer = selected();
  if (!doc || !layer) return;
  checkpoint();
  doc.layers = doc.layers.filter((l) => l.id !== layer.id);
  if (layer.type === "image") {
    const stillUsed = doc.layers.some((l) => l.type === "image" && l.assetId === layer.assetId);
    if (!stillUsed) forgetAsset(layer.assetId);
  }
  doc.selectedId = doc.layers.at(-1)?.id ?? null;
  paint();
}

async function addImageFiles(files: File[], at?: { x: number; y: number }): Promise<void> {
  if (!doc) return;
  const { w, h } = pageSize(doc);
  let stagger = doc.layers.filter((layer) => layer.type === "image").length;
  for (const file of files) {
    try {
      const asset = await loadImageFile(file);
      const fitted = fitImageToPage(
        asset.image.naturalWidth,
        asset.image.naturalHeight,
        w,
        h,
        doc.autoResize ? 1 : 0.86,
      );
      checkpoint();
      const shift = doc.autoResize || at ? 0 : stagger * 48;
      const layer: ImageLayer = {
        id: crypto.randomUUID(),
        type: "image",
        name: asset.name,
        visible: true,
        locked: false,
        opacity: 1,
        x: doc.autoResize ? w / 2 : Math.min(w - 40, (at?.x ?? w / 2) + shift),
        y: doc.autoResize ? h / 2 : Math.min(h - 40, (at?.y ?? h / 2) + shift),
        width: fitted.width,
        height: fitted.height,
        rotation: 0,
        assetId: asset.id,
        keep: false,
        stroke: "#111318",
        strokeWidthMm: 0,
      };
      doc.layers.push(layer);
      doc.selectedId = layer.id;
      stagger += 1;
    } catch {
      toast(`${file.name} konnte nicht geladen werden. HEIC kommt in v2.`);
    }
  }
  paint();
}

function addText(): void {
  if (!doc) return;
  const { w, h } = pageSize(doc);
  checkpoint();
  const layer: TextLayer = { id: crypto.randomUUID(), ...defaultTextLayer(w, h) };
  doc.layers.push(layer);
  doc.selectedId = layer.id;
  paint();
}

async function doExport(kind: "jpeg" | "png"): Promise<void> {
  if (!doc) return;
  try {
    const { blob, filename } = await exportDocument(doc, kind);
    downloadBlob(blob, filename);
    toast(`${filename} gespeichert`);
  } catch (err) {
    console.error(err);
    toast("Export fehlgeschlagen");
  }
}

function onPaste(e: ClipboardEvent): void {
  if (!doc) return;
  const items = [...(e.clipboardData?.items ?? [])];
  const files = items
    .filter((item) => item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file));
  if (files.length === 0) return;
  e.preventDefault();
  void addImageFiles(files);
}

function onDrop(e: DragEvent): void {
  e.preventDefault();
  workspace.classList.remove("dragover");
  if (!doc || !stage) return;
  const files = [...(e.dataTransfer?.files ?? [])].filter((f) => f.type.startsWith("image/"));
  if (files.length === 0) {
    toast("Kein Bild in der Ablage");
    return;
  }
  const at = stage.screenToPage(e.clientX, e.clientY) ?? undefined;
  void addImageFiles(files, at);
}

function onKey(e: KeyboardEvent): void {
  if (!doc) return;
  const meta = e.metaKey || e.ctrlKey;
  const typing =
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement ||
    e.target instanceof HTMLSelectElement;
  if (meta && e.key.toLowerCase() === "z") {
    e.preventDefault();
    if (e.shiftKey) redo();
    else undo();
    return;
  }
  if (meta && e.key.toLowerCase() === "y") {
    e.preventDefault();
    redo();
    return;
  }
  if (typing) return;
  if ((e.key === "Backspace" || e.key === "Delete") && doc.selectedId) {
    e.preventDefault();
    deleteSelected();
  }
  if (e.key === "Escape") {
    doc.selectedId = null;
    paint();
  }
}

function undo(): void {
  if (!doc) return;
  const next = history.undo(cloneLayers(doc.layers));
  if (!next) return;
  doc.layers = next;
  const selectedId = doc.selectedId;
  if (selectedId && !doc.layers.some((l) => l.id === selectedId)) doc.selectedId = null;
  paint();
}

function redo(): void {
  if (!doc) return;
  const next = history.redo(cloneLayers(doc.layers));
  if (!next) return;
  doc.layers = next;
  paint();
}

function useCustomFormat(): void {
  formatId = CUSTOM_FORMAT_ID;
  updateCustomPreview();
  renderSetup();
}

customW.addEventListener("input", useCustomFormat);
customH.addEventListener("input", useCustomFormat);
customDpiEl.addEventListener("input", useCustomFormat);
customUnitEl.addEventListener("change", () => {
  const next = customUnitEl.value as LengthUnit;
  const dpi = readNumber(customDpiEl) || DPI;
  const wMm = toMm(readNumber(customW), lastCustomUnit, dpi);
  const hMm = toMm(readNumber(customH), lastCustomUnit, dpi);
  if (Number.isFinite(wMm) && Number.isFinite(hMm)) {
    customW.value = String(roundNice(fromMm(wMm, next, dpi)));
    customH.value = String(roundNice(fromMm(hMm, next, dpi)));
  }
  lastCustomUnit = next;
  useCustomFormat();
});
customSwap.addEventListener("click", () => {
  const w = customW.value;
  customW.value = customH.value;
  customH.value = w;
  useCustomFormat();
});

startBtn.addEventListener("click", openEditor);
btnNew.addEventListener("click", closeEditor);
btnSame.addEventListener("click", newPhotoSameSettings);
btnSafe.addEventListener("click", () => {
  if (!doc) return;
  doc.showSafeZone = !doc.showSafeZone;
  paint();
});
btnAutoResize.addEventListener("click", () => {
  if (!doc) return;
  doc.autoResize = !doc.autoResize;
  autoResizeDefault = doc.autoResize;
  paint();
});
btnUndo.addEventListener("click", undo);
btnRedo.addEventListener("click", redo);
btnImages.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const files = [...(fileInput.files ?? [])];
  fileInput.value = "";
  if (files.length) void addImageFiles(files);
});
btnText.addEventListener("click", addText);
btnJpeg.addEventListener("click", () => void doExport("jpeg"));
btnPng.addEventListener("click", () => void doExport("png"));

window.addEventListener("paste", onPaste);
window.addEventListener("keydown", onKey);
window.addEventListener("resize", () => stage?.resize());

workspace.addEventListener("dragover", (e) => {
  e.preventDefault();
  workspace.classList.add("dragover");
});
workspace.addEventListener("dragleave", () => workspace.classList.remove("dragover"));
workspace.addEventListener("drop", onDrop);

renderSetup();
