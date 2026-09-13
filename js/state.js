import { TEMA_POR_DEFECTO } from './themes.js';

export const TAMANO_CHUNK = 4;
export const TAMANO_CASILLA_BASE = 20;

export const state = {
  ANCHO_CHUNKS: 16,
  ALTO_CHUNKS: 12,
  ANCHO_MAPA: 32,
  ALTO_MAPA: 24,

  // Grid unificado: cada celda es un string ('muro','suelo','entrada','salida','enemigo','trampa')
  grid: [],
  habitaciones: [],
  zonaSeleccionada: null,

  herramientaActual: 'muro',
  estaDibujando: false,
  semillaActual: '',
  rng: Math.random,

  // Tamaño real de cada casilla en px "de mundo" (se mantiene fijo; el zoom lo maneja la cámara)
  tamanoCasilla: TAMANO_CASILLA_BASE,

  // Cámara para Pan & Zoom (estilo Figma)
  camara: { x: 0, y: 0, zoom: 1 },

  // Vista de Jugador: oculta trampas/enemigos/zonas/notas y desactiva la edición
  modoJugador: false,

  // Bioma / temática visual activa
  temaActual: TEMA_POR_DEFECTO,

  // Estado de interacción
  espacioPresionado: false,
  arrastrandoCamara: false,
  ultimoPuntero: { x: 0, y: 0 },
  arrastrandoZona: null // { hab, offsetGridX, offsetGridY }
};

export function actualizarDimensiones(ancho, alto) {
  state.ANCHO_CHUNKS = ancho;
  state.ALTO_CHUNKS = alto;
  state.ANCHO_MAPA = Math.max(16, ancho * 2);
  state.ALTO_MAPA = Math.max(16, alto * 2);
}

// --- Snapshots para el sistema de Undo/Redo ---
export function clonarEstadoMapa() {
  return {
    grid: state.grid.map(fila => fila.slice()),
    habitaciones: JSON.parse(JSON.stringify(state.habitaciones)),
    zonaSeleccionada: state.zonaSeleccionada
  };
}

export function restaurarEstadoMapa(snapshot) {
  state.grid = snapshot.grid.map(fila => fila.slice());
  state.habitaciones = JSON.parse(JSON.stringify(snapshot.habitaciones));
  state.zonaSeleccionada = snapshot.zonaSeleccionada;
}