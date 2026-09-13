import { useCallback, useEffect, useMemo, useState } from "react";
import { fileToAsset } from "@/dungeon/assets";
import { imageCache, preloadImages } from "@/dungeon/renderer";
import { loadAssets, persistAssets } from "@/dungeon/storage";
import type { Asset, AssetKind, TileType } from "@/dungeon/types";

/**
 * Asset library state: texture/sprite uploads (pixel-capped), persistence,
 * per-tile-type texture assignment and preloaded image resolution.
 */

export function useAssetLibrary() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [textures, setTextures] = useState<Partial<Record<TileType, string>>>({});
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage once.
  useEffect(() => {
    const stored = loadAssets();
    setAssets(stored);
    void preloadImages(stored).then(() => setReady(true));
  }, []);

  const upload = useCallback(
    async (file: File, kind: AssetKind) => {
      const asset = await fileToAsset(file, kind);
      setAssets((prev) => {
        const next = [...prev.filter((a) => a.id !== asset.id), asset];
        persistAssets(next);
        return next;
      });
      await preloadImages([asset]);
      return asset;
    },
    [],
  );

  const removeAsset = useCallback((id: string) => {
    setAssets((prev) => {
      const next = prev.filter((a) => a.id !== id);
      persistAssets(next);
      imageCache.delete(id);
      return next;
    });
    setTextures((prev) => {
      const next: Partial<Record<TileType, string>> = {};
      for (const [tile, assetId] of Object.entries(prev)) {
        if (assetId !== id) next[tile as TileType] = assetId;
      }
      return next;
    });
  }, []);

  const assignTexture = useCallback((tile: TileType, assetId: string | null) => {
    setTextures((prev) => {
      const next = { ...prev };
      if (assetId) next[tile] = assetId;
      else delete next[tile];
      return next;
    });
  }, []);

  /** Resolved image elements per tile type (for the canvas renderer). */
  const textureImages = useMemo(() => {
    const map: Partial<Record<TileType, HTMLImageElement>> = {};
    for (const [tile, assetId] of Object.entries(textures)) {
      const img = imageCache.get(assetId);
      if (img) map[tile as TileType] = img;
    }
    return map;
  }, [textures, ready, assets]);

  const sprites = useMemo(() => assets.filter((a) => a.kind !== "texture"), [assets]);

  return {
    assets,
    sprites,
    textures,
    textureImages,
    assignTexture,
    upload,
    removeAsset,
    ready,
  };
}

export type AssetLibrary = ReturnType<typeof useAssetLibrary>;
