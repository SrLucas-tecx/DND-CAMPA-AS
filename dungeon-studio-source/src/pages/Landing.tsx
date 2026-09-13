import { motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  Dices,
  Download,
  Gem,
  Skull,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: EASE },
};

const FEATURES = [
  {
    icon: Compass,
    title: "Salas y pasillos",
    body: "Trazado determinista sobre rejilla: rectángulos puros, pasillos en L y un lazo extra para que la mazmorra respire.",
  },
  {
    icon: Skull,
    title: "Monstruos y tesoro",
    body: "Cada sala se puebla con encuentros y botines según la semilla. Coloca o borra marcas con clic sobre el mapa.",
  },
  {
    icon: Download,
    title: "Exportar como imagen",
    body: "Descarga el mapa en PNG a 1×, 2× o 4×, con sello de semilla y leyenda incluidos en la propia imagen.",
  },
];

function MiniMapArt() {
  const rooms = [
    { x: 4, y: 3, w: 9, h: 6 },
    { x: 17, y: 2, w: 7, h: 5 },
    { x: 16, y: 10, w: 8, h: 6 },
    { x: 5, y: 12, w: 6, h: 5 },
  ];
  return (
    <div className="relative border border-dungeon-wall/25 bg-[#201b14] p-3 shadow-[0_24px_60px_-30px_rgba(32,27,20,0.6)]">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {rooms.map((r, i) => (
          <div
            key={i}
            className="absolute border-2 border-[#3d3428] bg-[#f3ead8]"
            style={{
              left: `${(r.x / 26) * 100}%`,
              top: `${(r.y / 18) * 100}%`,
              width: `${(r.w / 26) * 100}%`,
              height: `${(r.h / 18) * 100}%`,
            }}
          >
            {i === 1 && (
              <span className="absolute right-1.5 bottom-1.5 size-2 bg-[#a33c2f]" />
            )}
            {i === 2 && (
              <span className="absolute left-1.5 top-1.5 size-2 bg-[#b58a2c]" />
            )}
            {i === 0 && (
              <>
                <span className="absolute right-2 bottom-2 size-2 bg-[#a33c2f]" />
                <span className="absolute left-2 top-2 size-2 bg-[#b58a2c]" />
              </>
            )}
          </div>
        ))}
        {/* corridors */}
        <div className="absolute top-[26%] left-[50%] h-[10%] w-[16%] bg-[#f3ead8]" />
        <div className="absolute top-[26%] left-[62%] h-[40%] w-[10%] bg-[#f3ead8]" />
        <div className="absolute top-[60%] left-[38%] h-[10%] w-[24%] bg-[#f3ead8]" />
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
    >
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <span className="font-display text-lg font-semibold tracking-tight">
            Dungeon Studio
          </span>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <a href="/auth">Entrar</a>
            </Button>
            <Button asChild size="sm">
              <a href="/auth">
                Abrir el estudio
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-16 pb-20 sm:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Badge
              variant="outline"
              className="gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground"
            >
              <Sparkles className="size-3" />
              Generador de mazmorras para D&D
            </Badge>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
              Mazmorras a partir de una semilla. Cuadritos puros.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Escribe un código de semilla y Dungeon Studio traza salas,
              pasillos, monstruos y tesoros listos para tu sesión. La misma
              semilla, siempre la misma mazmorra.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-11 px-6 text-base">
                <a href="/auth">
                  Generar mi mazmorra
                  <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 px-6 text-base">
                <a href="#como-funciona">Ver cómo funciona</a>
              </Button>
            </div>
            <p className="mt-5 font-mono text-xs tracking-wide text-muted-foreground">
              Semilla de ejemplo — <span className="text-foreground">K7XT-2QP</span>
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
          >
            <MiniMapArt />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Vista de la mesa del máster · casillas de 5 pies
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="como-funciona" className="border-t border-border bg-secondary/40">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Versión 1
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Tres cosas, bien hechas
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <motion.article
                key={title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="flex flex-col gap-4 bg-card p-7"
              >
                <span className="flex size-10 items-center justify-center rounded-md border border-border bg-background text-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-display text-xl font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">{body}</p>
              </motion.article>
            ))}
          </div>

          <motion.div
            {...fadeUp}
            className="mt-14 flex flex-col items-start justify-between gap-6 rounded-xl border border-border bg-card p-8 sm:flex-row sm:items-center"
          >
            <div className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                <Dices className="size-5" />
              </span>
              <div>
                <p className="font-display text-xl font-semibold tracking-tight">
                  Tu mesa te espera
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Entra, tira la semilla y lleva el mapa exportado a tu próxima
                  sesión.
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0">
              <a href="/auth">
                Entrar al estudio
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2">
            <Gem className="size-4" />
            Dungeon Studio — forjado para másters
          </span>
          <span className="font-mono text-xs">v1 · salas · marcas · png</span>
        </div>
      </footer>
    </motion.div>
  );
}
