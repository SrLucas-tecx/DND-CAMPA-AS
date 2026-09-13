import { clonarEstadoMapa, restaurarEstadoMapa } from './state.js';

const MAX_HISTORIAL = 50;
let pila = [];
let indice = -1;
let restaurando = false;

export function inicializarHistorial() {
  pila = [clonarEstadoMapa()];
  indice = 0;
  actualizarBotones();
}

// Llamar SIEMPRE después de terminar una acción discreta (soltar el ratón, mover una zona, generar mapa nuevo)
export function guardarEstado() {
  if (restaurando) return;
  pila = pila.slice(0, indice + 1);
  pila.push(clonarEstadoMapa());
  if (pila.length > MAX_HISTORIAL) pila.shift();
  indice = pila.length - 1;
  actualizarBotones();
}

export function deshacer() {
  if (indice <= 0) return false;
  indice--;
  restaurando = true;
  restaurarEstadoMapa(pila[indice]);
  restaurando = false;
  actualizarBotones();
  return true;
}

export function rehacer() {
  if (indice >= pila.length - 1) return false;
  indice++;
  restaurando = true;
  restaurarEstadoMapa(pila[indice]);
  restaurando = false;
  actualizarBotones();
  return true;
}

function actualizarBotones() {
  const btnUndo = document.getElementById('btnUndo');
  const btnRedo = document.getElementById('btnRedo');
  if (btnUndo) btnUndo.disabled = indice <= 0;
  if (btnRedo) btnRedo.disabled = indice >= pila.length - 1;
}
