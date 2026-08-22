import type { Layer, PhotoDoc } from "./types";
import type { LengthUnit } from "./units";

const DB_NAME = "easy-photo-editor";
const DB_VERSION = 1;
const MAX_VERSIONS = 12;

export type SessionState = {
  inEditor: boolean;
  doc: PhotoDoc | null;
  providerId: string;
  formatId: string;
  custom: { w: string; h: string; unit: LengthUnit; dpi: string };
  autoResizeDefault: boolean;
  keptTemplate: { layers: Layer[]; pageW: number; pageH: number } | null;
  history: { past: string[]; future: string[] };
  savedAt: number;
};

export type VersionRecord = {
  id: string;
  savedAt: number;
  label: string;
  doc: PhotoDoc;
  thumb: Blob | null;
};

export type AssetRecord = {
  id: string;
  name: string;
  blob: Blob;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
      if (!db.objectStoreNames.contains("assets")) db.createObjectStore("assets");
      if (!db.objectStoreNames.contains("versions")) db.createObjectStore("versions", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSession(state: SessionState, blobs: AssetRecord[]): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(["kv", "assets"], "readwrite");
  tx.objectStore("kv").put(state, "session");
  const store = tx.objectStore("assets");
  for (const rec of blobs) store.put(rec, rec.id);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadSession(): Promise<SessionState | null> {
  const db = await openDb();
  const tx = db.transaction("kv", "readonly");
  const value = await reqToPromise(tx.objectStore("kv").get("session"));
  return (value as SessionState | undefined) ?? null;
}

export async function loadAssets(): Promise<AssetRecord[]> {
  const db = await openDb();
  const tx = db.transaction("assets", "readonly");
  const value = await reqToPromise(tx.objectStore("assets").getAll());
  return (value as AssetRecord[]) ?? [];
}

export async function clearSession(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(["kv", "assets"], "readwrite");
  tx.objectStore("kv").delete("session");
  tx.objectStore("assets").clear();
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveVersion(record: VersionRecord): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("versions", "readwrite");
  const store = tx.objectStore("versions");
  store.put(record);
  const all = await reqToPromise(store.getAll()) as VersionRecord[];
  all.sort((a, b) => b.savedAt - a.savedAt);
  for (const extra of all.slice(MAX_VERSIONS)) store.delete(extra.id);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listVersions(): Promise<VersionRecord[]> {
  const db = await openDb();
  const tx = db.transaction("versions", "readonly");
  const all = (await reqToPromise(tx.objectStore("versions").getAll())) as VersionRecord[];
  return all.sort((a, b) => b.savedAt - a.savedAt);
}

export async function getVersion(id: string): Promise<VersionRecord | null> {
  const db = await openDb();
  const tx = db.transaction("versions", "readonly");
  const value = await reqToPromise(tx.objectStore("versions").get(id));
  return (value as VersionRecord | undefined) ?? null;
}

export async function clearVersions(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("versions", "readwrite");
  tx.objectStore("versions").clear();
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
