import { createRng, randInt, shuffle, type Rng } from "./rng";
import {
  CHUNK_TILES,
  createTiles,
  fillRect,
  fillRectBorder,
  generateChunkTiles,
  setTile,
} from "./tiles";
import type { DungeonOptions, DungeonDoc, Room, TileType } from "./types";

/**
 * Chunk-based dungeon generation. The grid is carved as independent 3x3
 * chunk blocks, then seeded room rects, wall borders and L corridors are
 * applied on top. The same seed + options always produce the same dungeon.
 */

function centerOf(rect: { x: number; y: number; w: number; h: number }): { x: number; y: number } {
  return {
    x: Math.floor(rect.x + rect.w / 2),
    y: Math.floor(rect.y + rect.h / 2),
  };
}

function generateRoomRect(rng: Rng, width: number, height: number): { x: number; y: number; w: number; h: number } {
  // Snap sizes/positions to the 3x3 chunk lattice for chunked layouts.
  const w = randInt(rng, 2, 4) * CHUNK_TILES;
  const h = randInt(rng, 2, 3) * CHUNK_TILES;
  const cx = randInt(rng, 0, Math.floor(width / CHUNK_TILES) - 1);
  const cy = randInt(rng, 0, Math.floor(height / CHUNK_TILES) - 1);
  return {
    x: Math.min(cx * CHUNK_TILES, Math.max(0, width - w)),
    y: Math.min(cy * CHUNK_TILES, Math.max(0, height - h)),
    w: Math.min(w, width),
    h: Math.min(h, height),
  };
}

function overlaps(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function carveCorridor(
  rng: Rng,
  tiles: TileType[],
  width: number,
  height: number,
  from: { x: number; y: number },
  to: { x: number; y: number },
): void {
  const horizontalFirst = rng() < 0.5;
  const mid = horizontalFirst ? { x: to.x, y: from.y } : { x: from.x, y: to.y };
  const segments: Array<[number, number, number, number]> = horizontalFirst
    ? [
        [from.x, from.y, mid.x, mid.y],
        [mid.x, mid.y, to.x, to.y],
      ]
    : [
        [from.x, from.y, mid.x, mid.y],
        [mid.x, mid.y, to.x, to.y],
      ];
  for (const [x0, y0, x1, y1] of segments) {
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const t = tiles[y * width + x];
        if (!t || t === "void" || t === "wall" || t === "column") {
          setTile(tiles, width, height, x, y, "floor");
        }
      }
    }
  }
}

/** Generate a full dungeon document (tiles + rooms) from seed + options. */
export function generateDungeonDoc(
  options: DungeonOptions,
  name = "Mazmorra sin título",
): DungeonDoc {
  const { seed, width, height } = options;
  const rng = createRng(`${seed}::layout`);
  const chunkRng = createRng(`${seed}::chunks`);

  // 1. Chunked base texture.
  const tiles = generateChunkTiles(width, height, chunkRng);

  // 2. Seeded rooms (rect + wall border + name).
  const targetRooms = Math.min(
    options.roomCount,
    Math.max(2, Math.floor((width * height) / 120)),
  );
  const rooms: Room[] = [];
  let attempts = 0;
  while (rooms.length < targetRooms && attempts < 200) {
    attempts += 1;
    const candidate = generateRoomRect(rng, width, height);
    if (rooms.some((r) => overlaps(candidate, r.rect))) continue;
    fillRect(tiles, width, height, candidate, "floor");
    fillRectBorder(tiles, width, height, candidate, "wall");
    rooms.push({
      id: `room-${rooms.length + 1}`,
      name: `Sala ${rooms.length + 1}`,
      rect: candidate,
    });
  }

  // 3. Corridors: connect each room to the nearest already-connected room.
  if (rooms.length >= 2) {
    const order = shuffle(rng, rooms.slice(1));
    const connected: Room[] = [rooms[0]];
    const pending = [...order];
    while (pending.length > 0) {
      const tail = centerOf(connected[connected.length - 1].rect);
      let bestIdx = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      pending.forEach((room, i) => {
        const c = centerOf(room.rect);
        const dist = Math.abs(c.x - tail.x) + Math.abs(c.y - tail.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });
      const next = pending.splice(bestIdx, 1)[0];
      carveCorridor(rng, tiles, width, height, tail, centerOf(next.rect));
      connected.push(next);
    }
    // One extra loop for non-tree topology.
    const a = rooms[randInt(rng, 0, rooms.length - 1)];
    const b = rooms[randInt(rng, 0, rooms.length - 1)];
    if (a.id !== b.id) {
      carveCorridor(rng, tiles, width, height, centerOf(a.rect), centerOf(b.rect));
    }
  }

  return {
    id: `doc-${Date.now()}`,
    name,
    options,
    tiles,
    rooms,
    sprites: [],
    narrative: "",
    entries: [],
    updatedAt: Date.now(),
  };
}

export { createTiles, centerOf };
