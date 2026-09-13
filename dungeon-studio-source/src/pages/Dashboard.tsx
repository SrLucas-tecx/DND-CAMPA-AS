import { Map as MapIcon, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { TILE_COLORS } from "@/dungeon/tiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { ArtTab } from "@/studio/art-tab";
import { MapCanvas } from "@/studio/map-canvas";
import { NarrativeTab } from "@/studio/narrative-tab";
import { StructureTab } from "@/studio/structure-tab";
import { useAssetLibrary } from "@/studio/use-asset-library";
import { useDungeonStudio } from "@/studio/use-dungeon-studio";

/**
 * Dungeon Studio — the Dungeon Master's workspace:
 * seed panel + tools in tabs on the left, live map on the right.
 */
export default function Dashboard() {
  const studio = useDungeonStudio();
  const library = useAssetLibrary();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSpriteId, setActiveSpriteId] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);

  // Load persisted seeds/docs after mount.
  useEffect(() => {
    studio.hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSprite =
    library.sprites.find((s) => s.id === activeSpriteId) ??
    library.sprites[0] ??
    null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <MapIcon className="size-4" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              Dungeon Studio
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user?.name && (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.name}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="size-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Workspace */}
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Mesa del Dungeon Master
            </p>
            <Input
              value={studio.doc.name}
              onChange={(e) => studio.renameDoc(e.target.value)}
              className="h-9 w-72 border-transparent bg-transparent px-0 font-display text-2xl font-semibold tracking-tight shadow-none focus-visible:border-border focus-visible:bg-background focus-visible:px-3"
              aria-label="Nombre de la mazmorra"
            />
          </div>
          <div className="flex flex-wrap items-center gap-6 font-mono text-xs text-muted-foreground">
            <span>{studio.doc.options.width}×{studio.doc.options.height} casillas</span>
            <span>chunks 3×3</span>
            <span>{studio.doc.rooms.length} salas</span>
            <span>{studio.doc.sprites.length} figuras</span>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          {/* Tabs */}
          <Tabs defaultValue="estructura" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="estructura">Estructura</TabsTrigger>
              <TabsTrigger value="arte">Arte</TabsTrigger>
            </TabsList>
            <TabsContent value="estructura" className="mt-4">
              <StructureTab studio={studio} />
            </TabsContent>
            <TabsContent value="arte" className="mt-4">
              <StudioArtSection library={library} studio={studio} activeSpriteId={activeSpriteId} setActiveSpriteId={setActiveSpriteId} />
            </TabsContent>
          </Tabs>

          {/* Map column */}
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4">
              <div>
                <p className="text-sm font-medium">Mapa en vivo</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Semilla <span className="font-mono">{studio.doc.options.seed}</span> ·
                  casillas de 5 pies
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs">
                  Rejilla
                  <Switch checked={studio.showGrid} onCheckedChange={studio.setShowGrid} />
                </label>
                <label className="flex items-center gap-2 text-xs">
                  Chunks
                  <Switch checked={studio.showChunks} onCheckedChange={studio.setShowChunks} />
                </label>
                <label className="flex items-center gap-2 text-xs">
                  Nombres
                  <Switch checked={studio.showLabels} onCheckedChange={studio.setShowLabels} />
                </label>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border bg-card p-4 sm:p-6">
              <MapCanvas
                doc={studio.doc}
                tool={studio.tool}
                paintTile={studio.paintTile}
                activePresetId={studio.activePresetId}
                activeSprite={activeSprite}
                showGrid={studio.showGrid}
                showChunks={studio.showChunks}
                showLabels={studio.showLabels}
                showStamp={studio.stamp}
                textures={library.textureImages}
                onPaint={studio.paintAt}
                onStampPreset={studio.stampPresetAt}
                onPlaceSprite={(asset, x, y, flipped) => studio.placeSprite(asset, x, y, flipped)}
                onRemoveSprite={studio.removeSpriteAt}
                renderKey={renderKey}
              />
            </div>

            <p className="text-xs leading-5 text-muted-foreground">
              Pinta casillas (piso, pared, columna, agua…), estampa estructuras
              predefinidas y coloca sprites de enemigos y jugadores. La misma
              semilla reproduce siempre la misma mazmorra.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/** Arte tab content + tool wiring shared with the studio. */
function StudioArtSection({
  library,
  studio,
  activeSpriteId,
  setActiveSpriteId,
}: {
  library: ReturnType<typeof useAssetLibrary>;
  studio: ReturnType<typeof useDungeonStudio>;
  activeSpriteId: string | null;
  setActiveSpriteId: (id: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <ArtTab library={library} />
      <ToolPalette studio={studio} library={library} activeSpriteId={activeSpriteId} setActiveSpriteId={setActiveSpriteId} />
    </div>
  );
}

/** Tool selector shown under the Arte tab (paint tile + tool mode). */
function ToolPalette({
  studio,
  library,
  activeSpriteId,
  setActiveSpriteId,
}: {
  studio: ReturnType<typeof useDungeonStudio>;
  library: ReturnType<typeof useAssetLibrary>;
  activeSpriteId: string | null;
  setActiveSpriteId: (id: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Herramienta activa
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(["select", "paint", "erase", "preset", "sprite", "remove-sprite"] as const).map((mode) => {
            const active = studio.tool === mode;
            const label =
              mode === "select"
                ? "Seleccionar"
                : mode === "paint"
                  ? "Pintar"
                  : mode === "erase"
                    ? "Borrar"
                    : mode === "preset"
                      ? "Estructura"
                      : mode === "sprite"
                        ? "Figura"
                        : "Quitar figura";
            return (
              <Button
                key={mode}
                variant="outline"
                size="sm"
                aria-pressed={active}
                className={
                  active
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    : ""
                }
                onClick={() => studio.setTool(mode)}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Tipo de casilla (para pintar)
        </p>
        <div className="flex flex-wrap gap-2">
          {(["floor", "wall", "column", "door", "water", "rubble", "stairs"] as const).map((tile) => {
            const active = studio.paintTile === tile;
            const label =
              tile === "floor"
                ? "Piso"
                : tile === "wall"
                  ? "Pared"
                  : tile === "column"
                    ? "Columna"
                    : tile === "door"
                      ? "Puerta"
                      : tile === "water"
                        ? "Agua"
                        : tile === "rubble"
                          ? "Escombros"
                          : "Escaleras";
            return (
              <button
                key={tile}
                onClick={() => studio.setPaintTile(tile)}
                aria-pressed={active}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent"
                }`}
              >
                <span
                  className="size-3 rounded-sm border border-border"
                  style={{ backgroundColor: TILE_COLORS[tile] }}
                />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Sprite activo
        </p>
        {library.sprites.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Sube sprites en la sección de arriba para colocarlos en el mapa.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {library.sprites.map((s) => {
              const active = (activeSpriteId ?? library.sprites[0]?.id) === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSpriteId(s.id)}
                  className={`flex flex-col items-center gap-1 rounded-md border p-2 ${
                    active ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-accent"
                  }`}
                  title={s.name}
                >
                  <img
                    src={s.dataUrl}
                    alt={s.name}
                    className="size-8 object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                    {s.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

