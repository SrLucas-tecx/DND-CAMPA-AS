import { CHUNK_TILES, TILE_COLORS } from "./tiles";
import type { Asset, DungeonDoc, Room, TileType } from "./types";

/**
 * Canvas 2D renderer for tile-grid dungeons: per-type tile colors, optional
 * repeating textures, sprite images, room name labels, 3x3 chunk overlay
 * and a seed stamp for exported images.
 */

export interface RenderOptions {
  tileSize: number;
  showGrid: boolean;
  showChunks: boolean;
  showLabels: boolean;
  stamp: boolean;
  seedText: string;
}

const STAMP_HEIGHT = 72;

export function canvasSize(
  dungeon: DungeonDoc,
  options: RenderOptions,
): { width: number; height: number } {
  const stamp = options.stamp ? STAMP_HEIGHT : 0;
  return {
    width: dungeon.options.width * options.tileSize + 2,
    height: dungeon.options.height * options.tileSize + 2 + stamp,
  };
}

interface DrawContext {
  ctx: CanvasRenderingContext2D;
  tile: number;
  ox: number;
  oy: number;
  textures: Partial<Record<TileType, HTMLImageElement>>;
  imageCache: Map<string, HTMLImageElement>;
}

export const imageCache = new Map<string, HTMLImageElement>();

/** Preload asset data-URLs into the image cache. */
export async function preloadImages(assets: Asset[]): Promise<void> {
  await Promise.all(
    assets.map(
      (asset) =>
        new Promise<void>((resolve) => {
          if (imageCache.has(asset.id)) {
            resolve();
            return;
          }
          const img = new Image();
          img.onload = () => {
            imageCache.set(asset.id, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = asset.dataUrl;
        }),
    ),
  );
}

function paintTileColor(c: DrawContext, x: number, y: number, type: TileType): void {
  c.ctx.fillStyle = TILE_COLORS[type];
  c.ctx.fillRect(c.ox + x * c.tile, c.oy + y * c.tile, c.tile, c.tile);
}

function paintTileTexture(c: DrawContext, x: number, y: number, type: TileType): void {
  const img = c.textures[type];
  if (!img) return;
  // Repeat the texture over a 4x4 tile grid, sampling this tile's slice.
  const rep = 4;
  const sw = img.width / rep;
  const sh = img.height / rep;
  const sx = (x % rep) * sw;
  const sy = (y % rep) * sh;
  c.ctx.drawImage(
    img,
    sx,
    sy,
    sw,
    sh,
    c.ox + x * c.tile,
    c.oy + y * c.tile,
    c.tile,
    c.tile,
  );
}

function paintGrid(c: DrawContext, cols: number, rows: number): void {
  c.ctx.strokeStyle = "rgba(61,52,40,0.16)";
  c.ctx.lineWidth = 1;
  for (let i = 0; i <= cols; i++) {
    const gx = c.ox + i * c.tile + 0.5;
    c.ctx.beginPath();
    c.ctx.moveTo(gx, c.oy);
    c.ctx.lineTo(gx, c.oy + rows * c.tile);
    c.ctx.stroke();
  }
  for (let j = 0; j <= rows; j++) {
    const gy = c.oy + j * c.tile + 0.5;
    c.ctx.beginPath();
    c.ctx.moveTo(c.ox, gy);
    c.ctx.lineTo(c.ox + cols * c.tile, gy);
    c.ctx.stroke();
  }
}

function paintChunkOverlay(c: DrawContext, cols: number, rows: number): void {
  c.ctx.strokeStyle = "rgba(243,234,216,0.16)";
  c.ctx.lineWidth = 1;
  for (let x = 0; x <= cols; x += CHUNK_TILES) {
    const gx = c.ox + x * c.tile + 0.5;
    c.ctx.beginPath();
    c.ctx.moveTo(gx, c.oy);
    c.ctx.lineTo(gx, c.oy + rows * c.tile);
    c.ctx.stroke();
  }
  for (let y = 0; y <= rows; y += CHUNK_TILES) {
    const gy = c.oy + y * c.tile + 0.5;
    c.ctx.beginPath();
    c.ctx.moveTo(c.ox, gy);
    c.ctx.lineTo(c.ox + cols * c.tile, gy);
    c.ctx.stroke();
  }
}

function paintSprites(c: DrawContext, dungeon: DungeonDoc): void {
  for (const sp of dungeon.sprites) {
    const img = c.imageCache.get(sp.spriteId);
    if (!img) continue;
    const px = c.ox + sp.x * c.tile;
    const py = c.oy + sp.y * c.tile;
    const s = c.tile * sp.size;
    c.ctx.save();
    if (sp.flipped) {
      c.ctx.translate(px + s, py);
      c.ctx.scale(-1, 1);
      c.ctx.drawImage(img, 0, 0, s, s);
    } else {
      c.ctx.drawImage(img, px, py, s, s);
    }
    c.ctx.restore();
  }
}

function paintLabels(c: DrawContext, rooms: Room[]): void {
  const size = Math.max(9, Math.round(c.tile * 0.48));
  c.ctx.font = `500 ${size}px "JetBrains Mono", ui-monospace, monospace`;
  c.ctx.fillStyle = "rgba(61, 52, 40, 0.75)";
  c.ctx.textAlign = "center";
  c.ctx.textBaseline = "middle";
  for (const room of rooms) {
    const cx = c.ox + (room.rect.x + room.rect.w / 2) * c.tile;
    const cy = c.oy + (room.rect.y + room.rect.h / 2) * c.tile;
    c.ctx.fillText(room.name, cx, cy);
  }
}

function paintStamp(c: DrawContext, dungeon: DungeonDoc, seedText: string): void {
  const { ctx, tile, ox } = c;
  const top = dungeon.options.height * tile + 2;
  const right = ox + dungeon.options.width * tile;
  const cy = top + STAMP_HEIGHT / 2;

  ctx.strokeStyle = "rgba(243,234,216,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ox + 0.5, top + 0.5);
  ctx.lineTo(right - 0.5, top + 0.5);
  ctx.stroke();

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = "#f3ead8";
  ctx.font = `600 ${Math.round(STAMP_HEIGHT * 0.3)}px "Fraunces", ui-serif, Georgia, serif`;
  ctx.fillText(dungeon.name, ox, cy - 12);
  ctx.fillStyle = "rgba(243,234,216,0.62)";
  ctx.font = `400 ${Math.round(STAMP_HEIGHT * 0.2)}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.fillText(`Seed ${seedText || dungeon.options.seed}`, ox, cy + 13);

  ctx.textAlign = "right";
  ctx.font = `500 ${Math.round(STAMP_HEIGHT * 0.19)}px "Inter", ui-sans-serif, sans-serif`;
  ctx.fillText(
    `${dungeon.rooms.length} salas · ${dungeon.sprites.length} figuras`,
    right,
    cy,
  );
}

/** Draw the full dungeon map onto a canvas 2D context. */
export function renderDungeon(
  ctx: CanvasRenderingContext2D,
  dungeon: DungeonDoc,
  options: RenderOptions,
  textures: Partial<Record<TileType, HTMLImageElement>>,
): void {
  const size = canvasSize(dungeon, options);
  ctx.clearRect(0, 0, size.width, size.height);
  ctx.fillStyle = TILE_COLORS.void;
  ctx.fillRect(0, 0, size.width, size.height);

  const c: DrawContext = {
    ctx,
    tile: options.tileSize,
    ox: 1,
    oy: 1,
    textures,
    imageCache,
  };

  // 1. Tiles (colors + textures).
  for (let y = 0; y < dungeon.options.height; y++) {
    for (let x = 0; x < dungeon.options.width; x++) {
      const t = dungeon.tiles[y * dungeon.options.width + x];
      paintTileColor(c, x, y, t);
      paintTileTexture(c, x, y, t);
    }
  }

  // 2. Grid.
  if (options.showGrid) {
    paintGrid(c, dungeon.options.width, dungeon.options.height);
  }

  // 3. Chunk overlay (3x3 blocks).
  if (options.showChunks) {
    paintChunkOverlay(c, dungeon.options.width, dungeon.options.height);
  }

  // 4. Sprites.
  paintSprites(c, dungeon);

  // 5. Room name labels.
  if (options.showLabels) {
    paintLabels(c, dungeon.rooms);
  }

  // 6. Export stamp.
  if (options.stamp) {
    paintStamp(c, dungeon, options.seedText);
  }
}
