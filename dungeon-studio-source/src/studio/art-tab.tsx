import { Gem, ImagePlus, Skull, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { MAX_ASSET_PIXELS } from "@/dungeon/assets";
import { TILE_COLORS } from "@/dungeon/tiles";
import { TILE_LABELS, TILE_TYPES, type Asset, type AssetKind, type TileType } from "@/dungeon/types";
import type { AssetLibrary } from "@/studio/use-asset-library";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

const TEXTURE_TILES: TileType[] = ["floor", "wall", "door", "water", "rubble", "stairs"];

export function ArtTab({ library }: { library: AssetLibrary }) {
  const textureInput = useRef<HTMLInputElement>(null);
  const monsterInput = useRef<HTMLInputElement>(null);
  const playerInput = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<AssetKind>("texture");

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    uploadKind: AssetKind,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await library.upload(file, uploadKind);
    event.target.value = "";
  };

  const textures = library.assets.filter((a) => a.kind === "texture");
  const monsters = library.assets.filter((a) => a.kind === "sprite-monster");
  const players = library.assets.filter((a) => a.kind === "sprite-player");

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
      {/* Textures --------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <SectionTitle>Texturas por casilla</SectionTitle>
        <p className="text-xs leading-5 text-muted-foreground">
          Sube una imagen (máx. {MAX_ASSET_PIXELS}px) y asígnala a un tipo de
          casilla: se repetirá en mosaico sobre ese tipo en todo el mapa.
        </p>
        <input
          ref={textureInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleUpload(e, "texture")}
        />
        <Button variant="outline" size="sm" className="h-9" onClick={() => textureInput.current?.click()}>
          <ImagePlus className="size-4" />
          Subir textura
        </Button>

        <div className="flex flex-col gap-2">
          {TEXTURE_TILES.map((tile) => {
            const assigned = textures.find((t) => library.textures[tile] === t.id);
            return (
              <div key={tile} className="flex items-center justify-between gap-2 rounded-md border border-border/70 px-3 py-1.5">
                <span className="flex items-center gap-2 text-sm">
                  <span
                    className="size-3.5 shrink-0 rounded-sm border border-border"
                    style={{ backgroundColor: TILE_COLORS[tile] }}
                  />
                  {TILE_LABELS[tile]}
                </span>
                <div className="flex items-center gap-1.5">
                  {assigned && (
                    <>
                      <img
                        src={assigned.dataUrl}
                        alt={assigned.name}
                        className="size-6 rounded-sm border border-border object-cover"
                      />
                      <button
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => library.assignTexture(tile, null)}
                        title="Quitar textura"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </>
                  )}
                  <select
                    className="h-7 rounded-md border border-border bg-background px-1.5 text-xs"
                    value={library.textures[tile] ?? ""}
                    onChange={(e) => library.assignTexture(tile, e.target.value || null)}
                  >
                    <option value="">—</option>
                    {textures.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Separator />

      {/* Sprites ------------------------------------------------------------ */}
      <section className="flex flex-col gap-3">
        <SectionTitle>Sprites de enemigos y jugadores</SectionTitle>
        <p className="text-xs leading-5 text-muted-foreground">
          Sube sprites (máx. {MAX_ASSET_PIXELS}px por lado). Colócalos con la
          herramienta «Figura»; Alt+clic los voltea horizontalmente.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input
            ref={monsterInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleUpload(e, "sprite-monster")}
          />
          <input
            ref={playerInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleUpload(e, "sprite-player")}
          />
          <Button variant="outline" size="sm" className="h-9" onClick={() => monsterInput.current?.click()}>
            <Skull className="size-4" />
            Sprite enemigo
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={() => playerInput.current?.click()}>
            <Gem className="size-4" />
            Sprite jugador
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {[...monsters, ...players].map((asset) => (
            <SpriteRow key={asset.id} asset={asset} library={library} />
          ))}
          {monsters.length + players.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Aún no hay sprites. Sube PNG de enemigos o jugadores para colocarlos en el mapa.
            </p>
          )}
        </div>
      </section>

      <Separator />

      {/* Legend --------------------------------------------------------------- */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Leyenda de colores</SectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          {TILE_TYPES.filter((t) => t !== "void").map((tile) => (
            <span key={tile} className="flex items-center gap-2 text-xs">
              <span
                className="size-3 shrink-0 rounded-sm border border-border"
                style={{ backgroundColor: TILE_COLORS[tile] }}
              />
              {TILE_LABELS[tile]}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function SpriteRow({ asset, library }: { asset: Asset; library: AssetLibrary }) {
  const [size, setSize] = useState(asset.size);
  return (
    <div className="flex items-center gap-2 rounded-md border border-border/70 px-3 py-1.5">
      <img
        src={asset.dataUrl}
        alt={asset.name}
        className="size-8 shrink-0 rounded-sm border border-border object-contain"
        style={{ imageRendering: "pixelated" }}
      />
      <span className="min-w-0 flex-1 truncate text-sm">{asset.name}</span>
      <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
        {asset.width}×{asset.height}
      </Badge>
      <Slider
        value={[size]}
        min={1}
        max={4}
        step={1}
        className="w-20 shrink-0"
        onValueChange={([v]) => {
          setSize(v);
          asset.size = v;
        }}
      />
      <button
        className="shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => library.removeAsset(asset.id)}
        title="Eliminar sprite"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
