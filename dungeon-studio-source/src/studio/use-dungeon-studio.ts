import { useCallback, useMemo, useRef, useState } from "react";
import { generateDungeonDoc } from "@/dungeon/generator";
import {
  canvasSize,
  preloadImages,
  renderDungeon,
  type RenderOptions,
} from "@/dungeon/renderer";
import { randomSeed } from "@/dungeon/rng";
import {
  loadSavedSeeds,
  persistSavedSeed,
  removeSavedSeed,
  loadDocs,
  persistDoc,
  removeDoc,
} from "@/dungeon/storage";
import {
  PRESETS,
  setTile,
  stampPreset,
  type PresetPlacement,
} from "@/dungeon/tiles";
import type {
  Asset,
  DungeonDoc,
  NarrativeEntry,
  NarrativeEntryKind,
  SavedSeed,
  TileType,
  ToolMode,
} from "@/dungeon/types";

/**
 * Dungeon Studio state: dungeon document (tiles/rooms/sprites/narrative),
 * editing tools, preset stamping, saved seeds, sessions and PNG export.
 */

const EXPORT_TILE = 26;

const DEFAULT_OPTIONS = {
  seed: "P0RTADA",
  width: 48,
  height: 34,
  roomCount: 8,
};

export type ExportScale = 1 | 2 | 4;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function nowId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function useDungeonStudio() {
  const [doc, setDoc] = useState<DungeonDoc>(() =>
    generateDungeonDoc(DEFAULT_OPTIONS),
  );
  const [tool, setTool] = useState<ToolMode>("select");
  const [paintTile, setPaintTile] = useState<TileType>("floor");
  const [activePresetId, setActivePresetId] = useState<string>(PRESETS[0].id);
  const [showGrid, setShowGrid] = useState(true);
  const [showChunks, setShowChunks] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [stamp, setStamp] = useState(true);
  const [savedSeeds, setSavedSeeds] = useState<SavedSeed[]>([]);
  const [docs, setDocs] = useState<DungeonDoc[]>([]);
  const spriteCounter = useRef(0);

  // Hydrate persisted lists once.
  const hydrated = useRef(false);
  const hydrate = useCallback(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    setSavedSeeds(loadSavedSeeds());
    setDocs(loadDocs());
  }, []);

  // --- Generation ----------------------------------------------------------

  const generate = useCallback(
    (seed?: string) => {
      setDoc((prev) => {
        const nextSeed = seed ?? prev.options.seed;
        const next = generateDungeonDoc(
          { ...prev.options, seed: nextSeed },
          prev.name,
        );
        return { ...next, id: prev.id };
      });
    },
    [],
  );

  const regenerate = useCallback(() => {
    setDoc((prev) => {
      const seed = randomSeed();
      const next = generateDungeonDoc({ ...prev.options, seed }, prev.name);
      return { ...next, id: prev.id };
    });
  }, []);

  const setSeed = useCallback((seed: string) => {
    setDoc((prev) => ({
      ...prev,
      options: { ...prev.options, seed: seed.trim() || prev.options.seed },
    }));
  }, []);

  const setDimensions = useCallback((width: number, height: number) => {
    setDoc((prev) => {
      const next = generateDungeonDoc(
        {
          ...prev.options,
          width: clamp(Math.round(width), 24, 96),
          height: clamp(Math.round(height), 15, 64),
        },
        prev.name,
      );
      return { ...next, id: prev.id, name: prev.name, entries: prev.entries, narrative: prev.narrative };
    });
  }, []);

  const setRoomCount = useCallback((roomCount: number) => {
    setDoc((prev) => {
      const next = generateDungeonDoc(
        { ...prev.options, roomCount: clamp(Math.round(roomCount), 2, 16) },
        prev.name,
      );
      return { ...next, id: prev.id, entries: prev.entries, narrative: prev.narrative };
    });
  }, []);

  // --- Tile editing ----------------------------------------------------------

  const paintAt = useCallback(
    (x: number, y: number, type: TileType) => {
      setDoc((prev) => {
        const tiles = [...prev.tiles];
        const w = prev.options.width;
        const h = prev.options.height;
        if (x < 0 || y < 0 || x >= w || y >= h) return prev;
        if (tiles[y * w + x] === type) return prev;
        setTile(tiles, w, h, x, y, type);
        return { ...prev, tiles, updatedAt: Date.now() };
      });
    },
    [],
  );

  const stampPresetAt = useCallback((x: number, y: number) => {
    setDoc((prev) => {
      const preset = PRESETS.find((p) => p.id === activePresetId) ?? PRESETS[0];
      const tiles = [...prev.tiles];
      stampPreset(tiles, prev.options.width, prev.options.height, { preset, x, y });
      const roomName = `${preset.defaultName} ${prev.rooms.length + 1}`;
      const rooms = [...prev.rooms];
      const existing = rooms.find(
        (r) => r.rect.x === x && r.rect.y === y && r.rect.w === preset.art[0].length && r.rect.h === preset.art.length,
      );
      if (!existing) {
        rooms.push({
          id: `room-${Date.now()}-${rooms.length}`,
          name: roomName,
          rect: { x, y, w: preset.art[0].length, h: preset.art.length },
        });
      }
      return { ...prev, tiles, rooms, updatedAt: Date.now() };
    });
  }, [activePresetId]);

  // --- Sprites ---------------------------------------------------------------

  const placeSprite = useCallback(
    (asset: Asset, x: number, y: number, flipped = false) => {
      setDoc((prev) => ({
        ...prev,
        sprites: [
          ...prev.sprites,
          {
            id: `sprite-${spriteCounter.current++}`,
            spriteId: asset.id,
            x,
            y,
            size: asset.size,
            flipped,
          },
        ],
        updatedAt: Date.now(),
      }));
    },
    [],
  );

  const removeSpriteAt = useCallback((x: number, y: number) => {
    setDoc((prev) => ({
      ...prev,
      sprites: prev.sprites.filter((s) => s.x !== x || s.y !== y),
      updatedAt: Date.now(),
    }));
  }, []);

  const renameSprite = useCallback((spriteId: string, size: number) => {
    setDoc((prev) => ({
      ...prev,
      sprites: prev.sprites.map((s) => (s.id === spriteId ? { ...s, size } : s)),
      updatedAt: Date.now(),
    }));
  }, []);

  // --- Rooms -------------------------------------------------------------------

  const renameRoom = useCallback((roomId: string, name: string) => {
    setDoc((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) => (r.id === roomId ? { ...r, name } : r)),
      updatedAt: Date.now(),
    }));
  }, []);

  // --- Narrative ----------------------------------------------------------------

  const setNarrative = useCallback((narrative: string) => {
    setDoc((prev) => ({ ...prev, narrative, updatedAt: Date.now() }));
  }, []);

  const addNarrativeEntry = useCallback((kind: NarrativeEntryKind, text: string) => {
    setDoc((prev) => {
      const entry: NarrativeEntry = {
        id: nowId("entry"),
        kind,
        text,
        createdAt: Date.now(),
      };
      return { ...prev, entries: [...prev.entries, entry], updatedAt: Date.now() };
    });
  }, []);

  const removeNarrativeEntry = useCallback((entryId: string) => {
    setDoc((prev) => ({
      ...prev,
      entries: prev.entries.filter((e) => e.id !== entryId),
      updatedAt: Date.now(),
    }));
  }, []);

  // --- Doc management -------------------------------------------------------------

  const renameDoc = useCallback((name: string) => {
    setDoc((prev) => ({ ...prev, name, updatedAt: Date.now() }));
  }, []);

  const saveDoc = useCallback(() => {
    setDoc((prev) => {
      const next = { ...prev, updatedAt: Date.now() };
      persistDoc(next);
      setDocs(loadDocs());
      return next;
    });
  }, []);

  const openDoc = useCallback((id: string) => {
    setDocs((current) => {
      const found = current.find((d) => d.id === id);
      if (found) setDoc({ ...found });
      return current;
    });
  }, []);

  const deleteDoc = useCallback((id: string) => {
    removeSavedSeed(id);
    removeDoc(id);
    setDocs(loadDocs());
  }, []);

  // --- Saved seeds -------------------------------------------------------------------

  const saveSeed = useCallback((label: string) => {
    setDoc((prev) => {
      const entry: SavedSeed = {
        id: nowId("seed"),
        seed: prev.options.seed,
        width: prev.options.width,
        height: prev.options.height,
        roomCount: prev.options.roomCount,
        label: label.trim() || prev.options.seed,
        createdAt: Date.now(),
      };
      persistSavedSeed(entry);
      setSavedSeeds(loadSavedSeeds());
      return prev;
    });
  }, []);

  const deleteSeed = useCallback((id: string) => {
    removeSavedSeed(id);
    setSavedSeeds(loadSavedSeeds());
  }, []);

  const applySavedSeed = useCallback((entry: SavedSeed) => {
    setDoc((prev) => {
      const next = generateDungeonDoc(
        {
          seed: entry.seed,
          width: entry.width,
          height: entry.height,
          roomCount: entry.roomCount,
        },
        prev.name,
      );
      return { ...next, id: prev.id, entries: prev.entries, narrative: prev.narrative };
    });
  }, []);

  // --- Export -------------------------------------------------------------------------

  const exportPng = useCallback(
    async (scale: ExportScale = 2) => {
      const renderOptions: RenderOptions = {
        tileSize: EXPORT_TILE,
        showGrid: true,
        showChunks: false,
        showLabels: true,
        stamp: true,
        seedText: doc.options.seed,
      };
      const size = canvasSize(doc, renderOptions);
      const canvas = document.createElement("canvas");
      canvas.width = size.width * scale;
      canvas.height = size.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(scale, scale);
      renderDungeon(ctx, doc, renderOptions, {});
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${doc.name.toLowerCase().replace(/\s+/g, "-")}-${doc.options.seed.toLowerCase()}.png`;
      link.click();
      URL.revokeObjectURL(url);
    },
    [doc],
  );

  return {
    doc,
    docs,
    hydrate,
    tool,
    setTool,
    paintTile,
    setPaintTile,
    activePresetId,
    setActivePresetId,
    showGrid,
    setShowGrid,
    showChunks,
    setShowChunks,
    showLabels,
    setShowLabels,
    stamp,
    setStamp,
    generate,
    regenerate,
    setSeed,
    setDimensions,
    setRoomCount,
    paintAt,
    stampPresetAt,
    placeSprite,
    removeSpriteAt,
    renameSprite,
    renameRoom,
    setNarrative,
    addNarrativeEntry,
    removeNarrativeEntry,
    renameDoc,
    saveDoc,
    openDoc,
    deleteDoc,
    savedSeeds,
    saveSeed,
    deleteSeed,
    applySavedSeed,
    exportPng,
  };
}

export type DungeonStudioState = ReturnType<typeof useDungeonStudio>;
