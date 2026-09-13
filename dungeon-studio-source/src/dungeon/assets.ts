import type { Asset, AssetKind } from "./types";

/**
 * Texture/sprite asset pipeline. Images are resized so no edge exceeds
 * MAX_ASSET_PIXELS — keeps localStorage light and the projector smooth.
 */

export const MAX_ASSET_PIXELS = 256;

let assetSeq = 0;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = src;
  });
}

/** Resize an image so its longest edge is ≤ maxEdge, preserving ratio. */
function fitToCanvas(img: HTMLImageElement, maxEdge: number): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, w, h);
  }
  return canvas;
}

/** Build an Asset from an uploaded file, resized to the pixel cap. */
export async function fileToAsset(file: File, kind: AssetKind): Promise<Asset> {
  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const canvas = fitToCanvas(img, MAX_ASSET_PIXELS);
  assetSeq += 1;
  return {
    id: `asset-${Date.now()}-${assetSeq}`,
    kind,
    name: file.name.replace(/\.[^.]+$/, "").slice(0, 40) || `Activo ${assetSeq}`,
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
    // Textures repeat over 4x4 tiles; sprites occupy 1 tile by default.
    size: kind === "texture" ? 4 : 1,
  };
}
