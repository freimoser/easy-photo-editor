export type ImageAsset = {
  id: string;
  image: HTMLImageElement;
  url: string;
  name: string;
};

const assets = new Map<string, ImageAsset>();

export function getAsset(id: string): ImageAsset | undefined {
  return assets.get(id);
}

export function forgetAsset(id: string): void {
  const asset = assets.get(id);
  if (asset) URL.revokeObjectURL(asset.url);
  assets.delete(id);
}

export function clearAssets(): void {
  for (const id of [...assets.keys()]) forgetAsset(id);
}

export function pruneAssets(keepIds: Iterable<string>): void {
  const keep = new Set(keepIds);
  for (const id of [...assets.keys()]) {
    if (!keep.has(id)) forgetAsset(id);
  }
}

export function loadImageFile(file: File): Promise<ImageAsset> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Keine Bilddatei"));
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const id = crypto.randomUUID();
      const asset: ImageAsset = {
        id,
        image,
        url,
        name: file.name.replace(/\.[^.]+$/, "") || "Bild",
      };
      assets.set(id, asset);
      resolve(asset);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Bild konnte nicht geladen werden"));
    };
    image.src = url;
  });
}
