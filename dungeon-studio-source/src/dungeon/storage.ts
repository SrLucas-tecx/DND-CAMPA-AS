import type { Asset, DungeonDoc, SavedSeed } from "./types";

/**
 * localStorage-backed persistence: saved seeds, saved dungeon sessions
 * and the uploaded asset library. All access is guarded (private mode safe).
 */

const KEYS = {
  seeds: "dungeon-studio:seeds",
  docs: "dungeon-studio:docs",
  assets: "dungeon-studio:assets",
} as const;

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Quota exceeded or storage unavailable — fail silently.
  }
}

// --- Saved seeds -----------------------------------------------------------

export function loadSavedSeeds(): SavedSeed[] {
  return read<SavedSeed>(KEYS.seeds).sort((a, b) => b.createdAt - a.createdAt);
}

export function persistSavedSeed(entry: SavedSeed): void {
  const all = read<SavedSeed>(KEYS.seeds).filter(
    (s) => s.seed !== entry.seed || s.width !== entry.width || s.height !== entry.height,
  );
  all.push(entry);
  write(KEYS.seeds, all);
}

export function removeSavedSeed(id: string): void {
  write(
    KEYS.seeds,
    read<SavedSeed>(KEYS.seeds).filter((s) => s.id !== id),
  );
}

// --- Dungeon sessions ------------------------------------------------------

export function loadDocs(): DungeonDoc[] {
  return read<DungeonDoc>(KEYS.docs).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function persistDoc(doc: DungeonDoc): void {
  const all = read<DungeonDoc>(KEYS.docs).filter((d) => d.id !== doc.id);
  all.push(doc);
  write(KEYS.docs, all.slice(0, 20));
}

export function removeDoc(id: string): void {
  write(
    KEYS.docs,
    read<DungeonDoc>(KEYS.docs).filter((d) => d.id !== id),
  );
}

// --- Asset library ----------------------------------------------------------

export function loadAssets(): Asset[] {
  return read<Asset>(KEYS.assets);
}

export function persistAssets(assets: Asset[]): void {
  write(KEYS.assets, assets);
}
