import { BookOpen, Download, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { NarrativeEntryKind } from "@/dungeon/types";
import type { DungeonStudioState, ExportScale } from "@/studio/use-dungeon-studio";

const ENTRY_KIND_LABELS: Record<NarrativeEntryKind, string> = {
  event: "Evento",
  combat: "Combate",
  treasure: "Tesoro",
  note: "Nota",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

export function NarrativeTab({ studio }: { studio: DungeonStudioState }) {
  const [entryKind, setEntryKind] = useState<NarrativeEntryKind>("event");
  const [entryText, setEntryText] = useState("");
  const [scale, setScale] = useState<ExportScale>(2);

  const addEntry = () => {
    if (!entryText.trim()) return;
    studio.addNarrativeEntry(entryKind, entryText.trim());
    setEntryText("");
  };

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
      {/* Journal ----------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <SectionTitle>Diario de campaña</SectionTitle>
        <Textarea
          value={studio.doc.narrative}
          onChange={(e) => studio.setNarrative(e.target.value)}
          placeholder="Notas libres de la sesión: el rumor del goblin, la puerta atrancada, la alianza del mago…"
          className="min-h-40 resize-y text-sm leading-6"
        />
      </section>

      <Separator />

      {/* Log ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-3">
        <SectionTitle>Registro de la sesión</SectionTitle>
        <div className="flex flex-col gap-2">
          <Label className="text-sm">Tipo</Label>
          <Select value={entryKind} onValueChange={(v) => setEntryKind(v as NarrativeEntryKind)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="event">Evento</SelectItem>
              <SelectItem value="combat">Combate</SelectItem>
              <SelectItem value="treasure">Tesoro</SelectItem>
              <SelectItem value="note">Nota</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            value={entryText}
            onChange={(e) => setEntryText(e.target.value)}
            placeholder="Ej. Los esqueletos de la sala 3 custodian un cofre sellado…"
            className="min-h-20 resize-y text-sm leading-6"
          />
          <Button size="sm" className="h-9" onClick={addEntry} disabled={!entryText.trim()}>
            <Plus className="size-4" />
            Añadir al registro
          </Button>
        </div>

        <ul className="flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1">
          {[...studio.doc.entries].reverse().map((entry) => (
            <li key={entry.id} className="group flex items-start gap-2 rounded-md border border-border/70 px-3 py-2 text-sm">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm bg-muted">
                <BookOpen className="size-3 text-muted-foreground" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {ENTRY_KIND_LABELS[entry.kind]}
                </span>
                <span className="block leading-5">{entry.text}</span>
              </span>
              <button
                className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                onClick={() => studio.removeNarrativeEntry(entry.id)}
                title="Eliminar entrada"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <Separator />

      {/* Export ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-3">
        <SectionTitle>Exportar</SectionTitle>
        <div className="flex gap-2">
          <Select value={String(scale)} onValueChange={(v) => setScale(Number(v) as ExportScale)}>
            <SelectTrigger className="h-9 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1×</SelectItem>
              <SelectItem value="2">2×</SelectItem>
              <SelectItem value="4">4×</SelectItem>
            </SelectContent>
          </Select>
          <Button className="h-9 flex-1" onClick={() => void studio.exportPng(scale)}>
            <Download className="size-4" />
            Exportar PNG
          </Button>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          El PNG incluye rejilla, etiquetas de salas y sello con la semilla —
          listo para proyectar en la mesa.
        </p>
      </section>
    </div>
  );
}
