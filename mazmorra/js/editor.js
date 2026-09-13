import { state } from './state.js';
import { reconectarPasillos } from './generator.js';

export function limpiarCasilla(gridX, gridY) {
  if (!state.grid[gridY] || state.grid[gridY][gridX] === undefined) return;
  if (state.grid[gridY][gridX] !== 'muro') {
    state.grid[gridY][gridX] = 'suelo';
  }
}

export function editarCasilla(gridX, gridY) {
  if (gridX < 0 || gridX >= state.ANCHO_MAPA || gridY < 0 || gridY >= state.ALTO_MAPA) return;
  if (!state.grid[gridY]) return;

  const h = state.herramientaActual;

  if (h === 'muro') {
    state.grid[gridY][gridX] = 'muro';
  } else if (h === 'suelo') {
    state.grid[gridY][gridX] = 'suelo';
  } else if (h === 'entrada') {
    state.grid[gridY][gridX] = 'entrada';
  } else if (h === 'salida') {
    state.grid[gridY][gridX] = 'salida';
  } else if (h === 'enemigo') {
    if (state.grid[gridY][gridX] !== 'muro') state.grid[gridY][gridX] = 'enemigo';
  } else if (h === 'trampa') {
    if (state.grid[gridY][gridX] !== 'muro') state.grid[gridY][gridX] = 'trampa';
  } else if (h === 'borrar_entidad') {
    limpiarCasilla(gridX, gridY);
  }
}

// Devuelve la habitación bajo una coordenada de grid (o null)
export function habitacionEnCasilla(gridX, gridY) {
  // Se recorre en orden inverso para priorizar la última dibujada (la que queda "encima" visualmente)
  for (let i = state.habitaciones.length - 1; i >= 0; i--) {
    const hab = state.habitaciones[i];
    if (gridX >= hab.x && gridX < hab.x + hab.w && gridY >= hab.y && gridY < hab.y + hab.h) {
      return hab;
    }
  }
  return null;
}

// Mueve una habitación completa y reconecta automáticamente los pasillos adyacentes
export function moverHabitacion(hab, nuevoX, nuevoY) {
  nuevoX = Math.max(0, Math.min(nuevoX, state.ANCHO_MAPA - hab.w));
  nuevoY = Math.max(0, Math.min(nuevoY, state.ALTO_MAPA - hab.h));

  // Borra la huella anterior de la sala (vuelve a muro; los pasillos de otras salas se regeneran después)
  for (let y = hab.y; y < hab.y + hab.h; y++) {
    for (let x = hab.x; x < hab.x + hab.w; x++) {
      if (state.grid[y] && state.grid[y][x] !== undefined) state.grid[y][x] = 'muro';
    }
  }

  hab.x = nuevoX;
  hab.y = nuevoY;

  // Repinta el suelo de la sala en su nueva posición
  for (let y = hab.y; y < hab.y + hab.h; y++) {
    for (let x = hab.x; x < hab.x + hab.w; x++) {
      if (state.grid[y] && state.grid[y][x] !== undefined) state.grid[y][x] = 'suelo';
    }
  }

  reconectarPasillos();
}
