/**
 * Core tile-grid dungeon model, asset types and persistence types.
 * Kept free of React/DOM dependencies so the logic stays testable.
 */

// ---------------------------------------------------------------------------
// Grid primitives
// ---------------------------------------------------------------------------

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Paintable tile types — each has its own color in the Studio palette. */
export type TileType =
  | "void"
  | "floor"
  | "wall"
  | "column"
  | "door"
  | "water"
  | "rubble"
  | "stairs";

export const TILE_TYPES: TileType[] = [
  "void",
  "floor",
 "wall",
  "column",
  "door",
  "water",
  "rubble",
  "stairs",
];

export const TILE_LABELS: Record<TileType, string> = {
  void: "Vacío",
  floor: "Piso",
  wall: "Pared",
  column: "Columna",
  door: "Puerta",
  water: "Agua",
  rubble: "Escombros",
  stairs: "Escaleras",
};

// ---------------------------------------------------------------------------
// Assets: textures + sprites (uploaded images, pixel-capped)
// ---------------------------------------------------------------------------

export type AssetKind = "texture" | "sprite-monster" | "sprite-player";

export interface Asset {
  id: string;
  kind: AssetKind;
  name: string;
  /** data:image/png (or jpeg) URL */
  dataUrl: string;
  width: number;
  height: number;
  /** Sprites: grid footprint (tiles). Textures: repeat size in tiles. */
  size: number;
}

export interface SpritePlacement {
  id: string;
  spriteId: string;
  x: number;
  y: number;
  size: number;
  flipped: boolean;
}

// ---------------------------------------------------------------------------
// Dungeon document
// ---------------------------------------------------------------------------

export interface Room {
  id: string;
  name: string;
  rect: Rect;
}

export interface DungeonOptions {
  seed: string;
  width: number;
  height: number;
  roomCount: number;
}

/** A dungeon document: tiles + rooms + sprite placements + narrative. */
export interface DungeonDoc {
  id: string;
  name: string;
  options: DungeonOptions;
  /** Row-major tiles[width*height] of TileType. */
  tiles: TileType[];
  rooms: Room[];
  sprites: SpritePlacement[];
  /** Free-form DM journal text. */
  narrative: string;
  /** Structured narrative log entries. */
  entries: NarrativeEntry[];
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// Presets (predefined structures you can stamp onto the grid)
// ---------------------------------------------------------------------------

export type PresetKind =
  | "room"
  | "corridor"
  | "room-cluster"
  | "entrance"
  | "stair-room"
  | "cistern";

export interface Preset {
  id: string;
  kind: PresetKind;
  name: "Sala" | "Pasillo" | "Complejo" | "Entrada" | "Sala escaleras" | "Cisterna";
  /** ASCII art template: each char maps to a tile type. */
  art: string[];
  defaultName: string;
}

// ---------------------------------------------------------------------------
// Persistence (localStorage-backed saved seeds / sessions)
// ---------------------------------------------------------------------------

export interface SavedSeed {
  id: string;
  seed: string;
  width: number;
  height: number;
  roomCount: number;
  label: string;
  createdAt: number;
}

export type NarrativeEntryKind = "event" | "combat" | "treasure" | "note";

/** Editing tools for the map canvas. */
export type ToolMode =
  | "select"
  | "paint"
  | "erase"
  | "preset"
  | "sprite"
  | "remove-sprite";

export interface NarrativeEntry {
  id: string;
  kind: NarrativeEntryKind;
  text: string;
  createdAt: number;
}
