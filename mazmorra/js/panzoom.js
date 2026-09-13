import { state } from './state.js';

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;

// Convierte una posición de cliente (e.clientX/Y) a coordenadas de grid, considerando cámara y DPI
export function clienteAGrid(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const escala = canvas.width / rect.width;

  const xLienzo = (clientX - rect.left) * escala;
  const yLienzo = (clientY - rect.top) * escala;

  const xMundo = (xLienzo - state.camara.x) / state.camara.zoom;
  const yMundo = (yLienzo - state.camara.y) / state.camara.zoom;

  return {
    gridX: Math.floor(xMundo / state.tamanoCasilla),
    gridY: Math.floor(yMundo / state.tamanoCasilla),
    xLienzo,
    yLienzo
  };
}

// Zoom centrado en el punto del cursor (rueda del ratón)
export function aplicarZoomEnPunto(canvas, clientX, clientY, deltaY) {
  const rect = canvas.getBoundingClientRect();
  const escala = canvas.width / rect.width;
  const xLienzo = (clientX - rect.left) * escala;
  const yLienzo = (clientY - rect.top) * escala;

  const zoomAnterior = state.camara.zoom;
  const factor = deltaY > 0 ? 0.9 : 1.1;
  const nuevoZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomAnterior * factor));

  state.camara.x = xLienzo - ((xLienzo - state.camara.x) / zoomAnterior) * nuevoZoom;
  state.camara.y = yLienzo - ((yLienzo - state.camara.y) / zoomAnterior) * nuevoZoom;
  state.camara.zoom = nuevoZoom;
}

export function moverCamara(dxLienzo, dyLienzo) {
  state.camara.x += dxLienzo;
  state.camara.y += dyLienzo;
}

// Encaja el mapa completo dentro del canvas (usado al redimensionar o al pulsar "Encajar vista")
export function encajarVista(canvas) {
  const anchoMundo = state.ANCHO_MAPA * state.tamanoCasilla;
  const altoMundo = state.ALTO_MAPA * state.tamanoCasilla;
  if (anchoMundo <= 0 || altoMundo <= 0) return;

  const zoom = Math.min(canvas.width / anchoMundo, canvas.height / altoMundo) * 0.95;
  state.camara.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
  state.camara.x = (canvas.width - anchoMundo * state.camara.zoom) / 2;
  state.camara.y = (canvas.height - altoMundo * state.camara.zoom) / 2;
}
