import type { Preset, Rect, TileType } from "./types";

/**
 * Tile colors (one per tile type), grid helpers, chunk-based generation
 * (3x3 chunks), and preset stamping.
 */

// ---------------------------------------------------------------------------
// Palette — different color per tile type (Studio warm neutrals)
// ---------------------------------------------------------------------------

export const TILE_COLORS: Record<TileType, string> = {
  void: "#201b14",
  floor: "#f3ead8",
  wall: "#3d3428",
  column: "#8a7a63",
  door: "#b58a2c",
  water: "#5f7d8c",
  rubble: "#a89680",
  stairs: "#a33c2f",
};

export const TILE_INK: Record<TileType, string> = {
  void: "rgba(243,234,216,0)",
  floor: "rgba(61,52,40,0.14)",
  wall: "rgba(243,234,216,0.18)",
  column: "#3d3428",
  door: "#3d3428",
  water: "rgba(243,234,216,0.5)",
  rubble: "rgba(61,52,40,0.35)",
  stairs: "#f3ead8",
};

/** Char used in preset ASCII art → tile type mapping. */
const ART_CHARS: Record<string, TileType> = {
  ".": "floor",
  "#": "wall",
  "o": "column",
  "d": "door",
  "~": "water",
  ",": "rubble",
  ">": "stairs",
};

export function artToTile(ch: string): TileType {
  return ART_CHARS[ch] ?? "void";
}

// ---------------------------------------------------------------------------
// Grid helpers
// ---------------------------------------------------------------------------

export function idx(x: number, y: number, width: number): number {
  return y * width + x;
}

export function inBounds(x: number, y: number, width: number, height: number): boolean {
  return x >= 0 && y >= 0 && x < width && y < height;
}

export function createTiles(width: number, height: number, fill: TileType = "void"): TileType[] {
  return new Array(width * height).fill(fill);
}

export function setTile(
  tiles: TileType[],
  width: number,
  height: number,
  x: number,
  y: number,
  type: TileType,
): void {
  if (inBounds(x, y, width, height)) {
    tiles[idx(x, y, width)] = type;
  }
}

export function fillRect(
  tiles: TileType[],
  width: number,
  height: number,
  rect: Rect,
  type: TileType,
): void {
  for (let dy = 0; dy < rect.h; dy++) {
    for (let dx = 0; dx < rect.w; dx++) {
      setTile(tiles, width, height, rect.x + dx, rect.y + dy, type);
    }
  }
}

export function fillRectBorder(
  tiles: TileType[],
  width: number,
  height: number,
  rect: Rect,
  type: TileType,
): void {
  for (let dx = 0; dx < rect.w; dx++) {
    setTile(tiles, width, height, rect.x + dx, rect.y, type);
    setTile(tiles, width, height, rect.x + dx, rect.y + rect.h - 1, type);
  }
  for (let dy = 0; dy < rect.h; dy++) {
    setTile(tiles, width, height, rect.x, rect.y + dy, type);
    setTile(tiles, width, height, rect.x + rect.w - 1, rect.y + dy, type);
  }
}

// ---------------------------------------------------------------------------
// Chunk generation — the map is carved in independent 3x3-chunk blocks
// ---------------------------------------------------------------------------

export const CHUNK_TILES = 3;

/**
 * Fill the grid by picking one tile type per 3x3 chunk (seeded), so the
 * dungeon emerges as chunked blocks that presets and corridors refine.
 */
export function generateChunkTiles(
  width: number,
  height: number,
  chunkRng: () => number,
  chunkPalette: TileType[] = ["floor", "wall", "column", "rubble", "water", "void"],
): TileType[] {
  const tiles = createTiles(width, height, "void");
  const chunkCols = Math.ceil(width / CHUNK_TILES);
  const chunkRows = Math.ceil(height / CHUNK_TILES);
  for (let cy = 0; cy < chunkRows; cy++) {
    for (let cx = 0; cx < chunkCols; cx++) {
      const pick = chunkPalette[Math.floor(chunkRng() * chunkPalette.length)];
      for (let dy = 0; dy < CHUNK_TILES; dy++) {
        for (let dx = 0; dx < CHUNK_TILES; dx++) {
          setTile(tiles, width, height, cx * CHUNK_TILES + dx, cy * CHUNK_TILES + dy, pick);
        }
      }
    }
  }
  return tiles;
}

// ---------------------------------------------------------------------------
// Presets — predefined structures to stamp and then connect by corridor
// ---------------------------------------------------------------------------

export const PRESETS: Preset[] = [
  {
    id: "room",
    kind: "room",
    name: "Sala",
    defaultName: "Sala",
    art: [
      "#######",
      "#.....#",
      "#..o..#",
      "#.....#",
      "#######",
    ],
  },
  {
    id: "corridor",
    kind: "corridor",
    name: "Pasillo",
    defaultName: "Pasillo",
    art: ["########", "........", "########"],
  },
  {
    id: "room-cluster",
    kind: "room-cluster",
    name: "Complejo",
    defaultName: "Complejo",
    art: [
      "######d######",
      "#.....#.....#",
      "#..o..#..o..#",
      "#.....d.....#",
      "######d######",
    ],
  },
  {
    id: "entrance",
    kind: "entrance",
    name: "Entrada",
    defaultName: "Entrada",
    art: [
      "#####...#####",
      "#...#...#...#",
      "#.o.#.d.#.o.#",
      "#...#...#...#",
      "#####...#####",
    ],
  },
  {
    id: "stair-room",
    kind: "stair-room",
    name: "Sala escaleras",
    defaultName: "Sala de escaleras",
    art: [
      "#########",
      "#...,...#",
      "#.o.>.o.#",
      "#...,...#",
      "#########",
    ],
  },
  {
    id: "cistern",
    kind: "cistern",
    name: "Cisterna",
    defaultName: "Cisterna",
    art: [
      "#########",
      "#,,.o.,.#",
      "#~~~~~~~#",
      "#~~.d.~~#",
      "#~~~~~~~#",
      "#########",
    ],
  },
];

export interface PresetPlacement {
  preset: Preset;
  x: number;
  y: number;
}

/** Stamp a preset's ASCII art onto the tile grid at (x, y). */
export function stampPreset(
  tiles: TileType[],
  width: number,
  height: number,
  placement: PresetPlacement,
): void {
  const { preset, x, y } = placement;
  preset.art.forEach((row, dy) => {
    [...row].forEach((ch, dx) => {
      const t = artToTile(ch);
      if (t !== "void") {
        setTile(tiles, width, height, x + dx, y + dy, t);
      }
    });
  });
}

/** Cells a preset stamp would cover (for hover ghost preview). */
export function presetCells(
  placement: PresetPlacement,
): Array<{ x: number; y: number; ch: string }> {
  const cells: Array<{ x: number; y: number; ch: string }> = [];
  placement.preset.art.forEach((row, dy) => {
    [...row].forEach((ch, dx) => {
      if (ch !== " ") cells.push({ x: placement.x + dx, y: placement.y + dy, ch });
    });
  });
  return cells;
}
