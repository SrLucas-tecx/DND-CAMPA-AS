import { Dices, FolderOpen, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { PRESETS } from "@/dungeon/tiles";
import type { DungeonStudioState } from "@/studio/use-dungeon-studio";
import type { ToolMode } from "@/dungeon/types";

const TOOLS: Array<{ mode: ToolMode; label: string }> = [
  { mode: "select", label: "Seleccionar" },
  { mode: "paint", label: "Pintar" },
  { mode: "erase", label: "Borrar" },
  { mode: "preset", label: "Estructura" },
  { mode: "sprite", label: "Figura" },
  { mode: "remove-sprite", label: "Quitar figura" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

export function StructureTab({ studio }: { studio: DungeonStudioState }) {
  const [seedDraft, setSeedDraft] = useState(studio.doc.options.seed);
  const [seedLabel, setSeedLabel] = useState("");

  useEffect(() => {
    setSeedDraft(studio.doc.options.seed);
  }, [studio.doc.options.seed]);

  const saveSeed = () => {
    studio.saveSeed(seedLabel);
    setSeedLabel("");
  };

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
      {/* Seed ----------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <SectionTitle>Semilla</SectionTitle>
        <div className="flex gap-2">
          <Input
            value={seedDraft}
            onChange={(e) => setSeedDraft(e.target.value)}
            placeholder="Ej. K7XT-2QP"
            className="h-9 font-mono text-sm"
            aria-label="Semilla"
          />
          <Button variant="outline" size="sm" className="h-9" onClick={() => studio.setSeed(seedDraft)}>
            Aplicar
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            onClick={studio.regenerate}
            title="Semilla aleatoria"
          >
            <Dices className="size-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            value={seedLabel}
            onChange={(e) => setSeedLabel(e.target.value)}
            placeholder="Nombre para guardar la semilla"
            className="h-9 text-sm"
          />
          <Button variant="outline" size="sm" className="h-9" onClick={saveSeed}>
            <Save className="size-4" />
            Guardar
          </Button>
        </div>
        {studio.savedSeeds.length > 0 && (
          <ul className="flex max-h-40 flex-col gap-1.5 overflow-y-auto pr-1">
            {studio.savedSeeds.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-border/70 px-3 py-1.5 text-sm">
                <button
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => studio.applySavedSeed(s)}
                  title="Cargar esta semilla"
                >
                  <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{s.label}</span>
                  <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">{s.seed}</span>
                </button>
                <button
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => studio.deleteSeed(s.id)}
                  title="Eliminar"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Separator />

      {/* Layout --------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <SectionTitle>Trazado</SectionTitle>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Salas</Label>
            <span className="font-mono text-xs text-muted-foreground">{studio.doc.options.roomCount}</span>
          </div>
          <Slider
            value={[studio.doc.options.roomCount]}
            min={2}
            max={16}
            step={1}
            onValueChange={([v]) => studio.setRoomCount(v)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Ancho</Label>
            <span className="font-mono text-xs text-muted-foreground">{studio.doc.options.width} casillas</span>
          </div>
          <Slider
            value={[studio.doc.options.width]}
            min={24}
            max={96}
            step={3}
            onValueChange={([v]) => studio.setDimensions(v, studio.doc.options.height)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Alto</Label>
            <span className="font-mono text-xs text-muted-foreground">{studio.doc.options.height} casillas</span>
          </div>
          <Slider
            value={[studio.doc.options.height]}
            min={15}
            max={64}
            step={3}
            onValueChange={([v]) => studio.setDimensions(studio.doc.options.width, v)}
          />
        </div>
      </section>

      <Separator />

      {/* Presets -------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <SectionTitle>Estructuras predefinidas</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => {
            const active = studio.activePresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  studio.setActivePresetId(p.id);
                  studio.setTool("preset");
                }}
                className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-accent"
                }`}
              >
                {p.name}
                <span className="mt-0.5 block font-mono text-[10px] opacity-70">
                  {p.art[0].length}×{p.art.length}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Con la herramienta «Estructura», haz clic en el mapa para estampar la
          plantilla y luego conecta los recorridos pintando pasillos.
        </p>
      </section>

      <Separator />

      {/* Rooms ---------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <SectionTitle>Salas ({studio.doc.rooms.length})</SectionTitle>
        <ul className="flex max-h-48 flex-col gap-1.5 overflow-y-auto pr-1">
          {studio.doc.rooms.map((room) => (
            <li key={room.id} className="flex items-center gap-2">
              <Input
                value={room.name}
                onChange={(e) => studio.renameRoom(room.id, e.target.value)}
                className="h-8 text-sm"
                aria-label="Nombre de la sala"
              />
              <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
                {room.rect.w}×{room.rect.h}
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      <Separator />

      {/* Sessions --------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <SectionTitle>Sesiones guardadas</SectionTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9 flex-1" onClick={studio.saveDoc}>
            <Save className="size-4" />
            Guardar mapa actual
          </Button>
        </div>
        {studio.docs.length > 0 && (
          <ul className="flex max-h-40 flex-col gap-1.5 overflow-y-auto pr-1">
            {studio.docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 rounded-md border border-border/70 px-3 py-1.5 text-sm">
                <button
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => studio.openDoc(d.id)}
                  title="Abrir esta mazmorra"
                >
                  <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{d.name}</span>
                </button>
                <button
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => studio.deleteDoc(d.id)}
                  title="Eliminar"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
