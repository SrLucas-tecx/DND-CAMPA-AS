import { useEffect, useRef, useState } from "react";
import {
  canvasSize,
  imageCache,
  preloadImages,
  renderDungeon,
  type RenderOptions,
} from "@/dungeon/renderer";
import { PRESETS, presetCells } from "@/dungeon/tiles";
import type { Asset, DungeonDoc, TileType, ToolMode } from "@/dungeon/types";

/**
 * Interactive map canvas. Pointer→tile picking drives painting, preset
 * stamping (with ghost preview), sprite placement and erasing.
 */

const TILE = 26;

interface MapCanvasProps {
  doc: DungeonDoc;
  tool: ToolMode;
  paintTile: TileType;
  activePresetId: string;
  activeSprite: Asset | null;
  showGrid: boolean;
  showChunks: boolean;
  showLabels: boolean;
  showStamp: boolean;
  textures: Partial<Record<TileType, HTMLImageElement>>;
  onPaint: (x: number, y: number, type: TileType) => void;
  onStampPreset: (x: number, y: number) => void;
  onPlaceSprite: (asset: Asset, x: number, y: number, flipped: boolean) => void;
  onRemoveSprite: (x: number, y: number) => void;
  renderKey: number;
}

export function MapCanvas({
  doc,
  tool,
  paintTile,
  activePresetId,
  activeSprite,
  showGrid,
  showChunks,
  showLabels,
  showStamp,
  textures,
  onPaint,
  onStampPreset,
  onPlaceSprite,
  onRemoveSprite,
  renderKey,
}: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [imagesReady, setImagesReady] = useState(0);

  const options: RenderOptions = {
    tileSize: TILE,
    showGrid,
    showChunks,
    showLabels,
    stamp: showStamp,
    seedText: doc.options.seed,
  };

  // Rerender on doc/tool/display changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const size = canvasSize(doc, options);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderDungeon(ctx, doc, options, textures);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, tool, showGrid, showChunks, showLabels, showStamp, textures, imagesReady, renderKey]);

  // Preload sprite images once per doc change.
  useEffect(() => {
    const spriteAssets: Asset[] = doc.sprites.map((s) => ({
      id: s.spriteId,
      kind: "sprite-monster" as const,
      name: "",
      dataUrl: "",
      width: 0,
      height: 0,
      size: 1,
    }));
    if (spriteAssets.length === 0) return;
    void preloadImages(spriteAssets).then(() => setImagesReady((n) => n + 1));
  }, [doc.sprites]);

  function tileFromEvent(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return null;
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.width / dpr;
    const scale = rect.width / cssWidth;
    const px = (event.clientX - rect.left) / scale;
    const py = (event.clientY - rect.top) / scale;
    const x = Math.floor((px - 1) / TILE);
    const y = Math.floor((py - 1) / TILE);
    if (x < 0 || y < 0 || x >= doc.options.width || y >= doc.options.height) return null;
    return { x, y };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const tile = tileFromEvent(event);
    if (!tile) return;
    switch (tool) {
      case "paint":
        onPaint(tile.x, tile.y, paintTile);
        break;
      case "erase":
        onPaint(tile.x, tile.y, "void");
        break;
      case "preset":
        onStampPreset(tile.x, tile.y);
        break;
      case "sprite":
        if (activeSprite) onPlaceSprite(activeSprite, tile.x, tile.y, event.altKey);
        break;
      case "remove-sprite":
        onRemoveSprite(tile.x, tile.y);
        break;
      default:
        break;
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const tile = tileFromEvent(event);
    setHover(tile);
    if (!tile) return;
    if (tool === "paint" && event.buttons === 1) {
      onPaint(tile.x, tile.y, paintTile);
    } else if (tool === "erase" && event.buttons === 1) {
      onPaint(tile.x, tile.y, "void");
    }
  }

  const preset = PRESETS.find((p) => p.id === activePresetId) ?? PRESETS[0];
  const ghostCells =
    tool === "preset" && hover
      ? presetCells({ preset, x: hover.x, y: hover.y })
      : [];

  return (
    <div className="relative inline-block max-w-full">
      <canvas
        ref={canvasRef}
        className="block h-auto max-w-full cursor-crosshair border border-border shadow-[0_18px_40px_-24px_rgba(32,27,20,0.55)]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHover(null)}
      />
      {/* Preset ghost overlay */}
      {ghostCells.length > 0 && (
        <div className="pointer-events-none absolute inset-0">
          {ghostCells.map((cell) => (
            <div
              key={`${cell.x},${cell.y}`}
              className="absolute border border-dashed border-primary/70 bg-primary/20"
              style={{
                left: `calc(${(cell.x * TILE + 1) / 26}px * var(--tile-scale, 1))`,
                top: `calc(${(cell.y * TILE + 1) / 26}px * var(--tile-scale, 1))`,
                width: `${TILE}px`,
                height: `${TILE}px`,
              }}
            />
          ))}
        </div>
      )}
      {/* Hover coordinates */}
      {hover && (
        <div className="pointer-events-none absolute top-2 right-2 rounded-md border border-border bg-popover px-2.5 py-1 font-mono text-[11px] text-popover-foreground shadow-sm">
          {hover.x},{hover.y}
        </div>
      )}
    </div>
  );
}
