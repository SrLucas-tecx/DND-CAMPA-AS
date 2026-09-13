import { state } from './state.js';

const INFRAESTRUCTURA_POR_CAPA = {
  superficie: [
    { nombre: "Puesto de Guardia", icono: "🛡️", eco: "Vigilancia exterior y centinelas.", ambiente: "Antorchas encendidas, barriles de flechas y marcas de patrulla reciente." },
    { nombre: "Entrada Colapsada", icono: "🚪", eco: "Acceso exterior y derrumbes.", ambiente: "Columnas derribadas desde el exterior, indicando una antigua invasión masiva." },
    { nombre: "Filtro de Trampas", icono: "⚠️", eco: "Defensa contra intrusos.", ambiente: "Mecanismos de presión oxidados y esqueletos de antiguos saqueadores." }
  ],
  medio: [
    { nombre: "Pozo y Fuentes de Agua", icono: "🚰", eco: "Abastecimiento hídrico vital.", ambiente: "Musgo luminoso en las paredes y cubos de madera oxidados colgados de sogas." },
    { nombre: "Cocina y Despensa", icono: "🍖", eco: "Suministros y preparación de alimentos.", ambiente: "Mesas de carnicero toscas, sacos de granos roídos y olor a humo denso." },
    { nombre: "Fosa de Desechos / Letrinas", icono: "☣️", eco: "Gestión de residuos y zona de carroñeros.", ambiente: "Charcos de lodo fétido con presencia de gelatinas o ratas gigantes." },
    { nombre: "Dormitorios de la Facción", icono: "🛏️", eco: "Zona de descanso de tropas y artesanos.", ambiente: "Camas de paja amontonadas, jarras de cerveza rotas y dagas clavadas en madera." }
  ],
  profundo: [
    { nombre: "Laboratorio Prohibido", icono: "🧪", eco: "Investigación y experimentos fallidos.", ambiente: "Frascos con fluidos luminiscentes y marcas de garras en el interior de las jaulas." },
    { nombre: "Santuario y Altar Ancestral", icono: "⛩️", eco: "Rituales y culto de la facción.", ambiente: "Arquitectura enana de piedra pulida sobre la cual construyeron altares de madera tosca." },
    { nombre: "Guarida del Jefe", icono: "👑", eco: "Núcleo de mando y custodia del tesoro.", ambiente: "Cofres reforzados, estandartes quemados y un mapa de guerra sobre la mesa central." },
    { nombre: "Cámara del Secreto", icono: "🔮", eco: "Resguardo de artefactos arcanos.", ambiente: "Runas grabadas que brillan en la penumbra y silencio sepulcral." }
  ]
};

const ELEMENTOS_JAQUAYSING = [
  "🔄 **Bucle (Loop):** Pasillo secundario que conecta con una zona previa para flanquear o escapar.",
  "🪜 **Conexión Vertical:** Escala de mano o grieta en el techo que lleva directamente a otra capa.",
  "🚪 **Atajo Bloqueado:** Puerta atrancada desde el otro lado. Se activa como retorno rápido.",
  "🕵️ **Ruta Alternativa:** Túnel estrecho de alcantarillado practicable arrastrándose."
];

export function initPRNG(seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  state.rng = function () {
    let t = (hash += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generarHabitaciones(maxHabitaciones, minTam, maxTam) {
  state.grid = Array(state.ALTO_MAPA).fill(null).map(() => Array(state.ANCHO_MAPA).fill('muro'));
  state.habitaciones = [];

  const paletaColores = ['#4caf50', '#2196f3', '#9c27b0', '#ff9800', '#e91e63', '#00bcd4', '#ff5722', '#673ab7'];

  for (let i = 0; i < maxHabitaciones; i++) {
    const w = Math.floor(state.rng() * (maxTam - minTam + 1)) + minTam;
    const h = Math.floor(state.rng() * (maxTam - minTam + 1)) + minTam;

    const maxX = Math.max(1, state.ANCHO_MAPA - w - 2);
    const maxY = Math.max(1, state.ALTO_MAPA - h - 2);
    const x = Math.floor(state.rng() * maxX) + 1;
    const y = Math.floor(state.rng() * maxY) + 1;

    let traslape = false;
    for (let hab of state.habitaciones) {
      if (
        x < hab.x + hab.w + 1 &&
        x + w + 1 > hab.x &&
        y < hab.y + hab.h + 1 &&
        y + h + 1 > hab.y
      ) {
        traslape = true;
        break;
      }
    }

    if (!traslape) {
      const id = state.habitaciones.length + 1;

      const ratioY = y / state.ALTO_MAPA;
      let capa = "superficie";
      let nombreCapa = "Superficie / Entrada";
      if (ratioY > 0.35 && ratioY <= 0.70) {
        capa = "medio";
        nombreCapa = "Nivel Medio";
      } else if (ratioY > 0.70) {
        capa = "profundo";
        nombreCapa = "Nivel Profundo";
      }

      const opcionesCapa = INFRAESTRUCTURA_POR_CAPA[capa];
      const infoInfra = opcionesCapa[Math.floor(state.rng() * opcionesCapa.length)];
      const elementoJaquays = ELEMENTOS_JAQUAYSING[Math.floor(state.rng() * ELEMENTOS_JAQUAYSING.length)];

      const notasGeneradas = `<div><b>[ ${nombreCapa.toUpperCase()} ]</b></div>` +
        `<div><b>Propósito Ecológico:</b> ${infoInfra.eco}</div>` +
        `<div><b>Historia Ambiental:</b> ${infoInfra.ambiente}</div><br>` +
        `<div><b>Estructura de Exploración:</b></div>` +
        `<div>${elementoJaquays}</div>`;

      const nuevaHab = {
        id: id,
        x: x,
        y: y,
        w: w,
        h: h,
        nombre: `${infoInfra.icono} ${infoInfra.nombre}`,
        color: paletaColores[(id - 1) % paletaColores.length],
        capa: capa,
        notas: notasGeneradas
      };

      for (let ry = y; ry < y + h; ry++) {
        for (let rx = x; rx < x + w; rx++) {
          if (state.grid[ry] && state.grid[ry][rx] !== undefined) {
            state.grid[ry][rx] = 'suelo';
          }
        }
      }

      // Colocación estratégica de Entrada, Salida, Enemigos y Trampas en el centro de los cuartos
      const centroX = Math.floor(x + w / 2);
      const centroY = Math.floor(y + h / 2);

      if (id === 1) {
        state.grid[centroY][centroX] = 'entrada';
      } else if (i === maxHabitaciones - 1) {
        state.grid[centroY][centroX] = 'salida';
      } else if (state.rng() > 0.6) {
        state.grid[centroY][centroX] = state.rng() > 0.5 ? 'enemigo' : 'trampa';
      }

      state.habitaciones.push(nuevaHab);
    }
  }

  reconectarPasillos();

  // Bucle extra (Jaquaysing)
  if (state.habitaciones.length >= 3) {
    const hIni = state.habitaciones[0];
    const hFin = state.habitaciones[state.habitaciones.length - 1];
    crearPasilloH(Math.floor(hIni.x + hIni.w / 2), Math.floor(hFin.x + hFin.w / 2), Math.floor(hIni.y + hIni.h / 2));
  }
}

// Redibuja los pasillos entre habitaciones consecutivas.
// Se reutiliza tanto en la generación inicial como al arrastrar y soltar una zona.
export function reconectarPasillos() {
  for (let i = 0; i < state.habitaciones.length - 1; i++) {
    const hA = state.habitaciones[i];
    const hB = state.habitaciones[i + 1];

    const cAX = Math.floor(hA.x + hA.w / 2);
    const cAY = Math.floor(hA.y + hA.h / 2);
    const cBX = Math.floor(hB.x + hB.w / 2);
    const cBY = Math.floor(hB.y + hB.h / 2);

    if (state.rng() > 0.5) {
      crearPasilloH(cAX, cBX, cAY);
      crearPasilloV(cAY, cBY, cBX);
    } else {
      crearPasilloV(cAY, cBY, cAX);
      crearPasilloH(cAX, cBX, cBY);
    }
  }
}

export function crearPasilloH(x1, x2, y) {
  const min = Math.min(x1, x2);
  const max = Math.max(x1, x2);
  for (let x = min; x <= max; x++) {
    if (state.grid[y] && state.grid[y][x] !== undefined) {
      if (state.grid[y][x] === 'muro') state.grid[y][x] = 'suelo';
    }
  }
}

export function crearPasilloV(y1, y2, x) {
  const min = Math.min(y1, y2);
  const max = Math.max(y1, y2);
  for (let y = min; y <= max; y++) {
    if (state.grid[y] && state.grid[y][x] !== undefined) {
      if (state.grid[y][x] === 'muro') state.grid[y][x] = 'suelo';
    }
  }
}
