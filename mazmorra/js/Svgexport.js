import { state } from './state.js';
import { TEMAS, TEMA_POR_DEFECTO } from './themes.js';

function escaparXML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Estimación de ancho de texto sin canvas (Arial bold ~11px): suficiente para
// dimensionar la caja de la etiqueta; no es una medición exacta carácter a carácter.
function anchoTextoAprox(texto) {
  return texto.length * 7.2;
}

function iconoEntradaSVG(px, py, T, tema) {
  return `
    <rect x="${px + 2}" y="${py + 2}" width="${T - 4}" height="${T - 4}" fill="${tema.entrada}" />
    <text x="${px + T / 2}" y="${py + T / 2 + 3}" fill="#ffffff" font-size="10" font-weight="bold" font-family="Arial" text-anchor="middle">IN</text>`;
}

function iconoSalidaSVG(px, py, T, tema) {
  return `
    <rect x="${px + 2}" y="${py + 2}" width="${T - 4}" height="${T - 4}" fill="${tema.salida}" />
    <text x="${px + T / 2}" y="${py + T / 2 + 3}" fill="#ffffff" font-size="10" font-weight="bold" font-family="Arial" text-anchor="middle">OUT</text>`;
}

function iconoEnemigoSVG(px, py, T, tema) {
  const cx = px + T / 2;
  const cy = py + T / 2;
  return `<circle cx="${cx}" cy="${cy}" r="${T / 3}" fill="${tema.enemigo}" stroke="${tema.enemigoBorde}" stroke-width="1" />`;
}

function iconoTrampaSVG(px, py, T, tema) {
  return `
    <line x1="${px + 4}" y1="${py + 4}" x2="${px + T - 4}" y2="${py + T - 4}" stroke="${tema.trampa}" stroke-width="2" />
    <line x1="${px + T - 4}" y1="${py + 4}" x2="${px + 4}" y2="${py + T - 4}" stroke="${tema.trampa}" stroke-width="2" />`;
}

// Genera el SVG completo del mapa (estructura + zonas), respetando el tema activo
// y ocultando enemigos/trampas/zonas si la Vista de Jugador está activa.
export function generarSVGMapa() {
  const T = state.tamanoCasilla;
  const tema = TEMAS[state.temaActual] || TEMAS[TEMA_POR_DEFECTO];
  const jugador = state.modoJugador;
  const anchoMundo = state.ANCHO_MAPA * T;
  const altoMundo = state.ALTO_MAPA * T;

  let celdas = '';

  for (let y = 0; y < state.ALTO_MAPA; y++) {
    for (let x = 0; x < state.ANCHO_MAPA; x++) {
      let tipo = (state.grid && state.grid[y]) ? state.grid[y][x] : 'muro';
      if (jugador && (tipo === 'enemigo' || tipo === 'trampa')) tipo = 'suelo';

      const px = x * T;
      const py = y * T;

      if (tipo === 'muro') {
        celdas += `<rect x="${px}" y="${py}" width="${T}" height="${T}" fill="${tema.muro}" stroke="${tema.muroBorde}" stroke-width="1" />`;
      } else {
        celdas += `<rect x="${px}" y="${py}" width="${T}" height="${T}" fill="${tema.suelo}" stroke="${tema.sueloBorde}" stroke-width="1" />`;
        if (tipo === 'entrada') celdas += iconoEntradaSVG(px, py, T, tema);
        else if (tipo === 'salida') celdas += iconoSalidaSVG(px, py, T, tema);
        else if (tipo === 'enemigo') celdas += iconoEnemigoSVG(px, py, T, tema);
        else if (tipo === 'trampa') celdas += iconoTrampaSVG(px, py, T, tema);
      }
    }
  }

  let zonas = '';
  if (!jugador) {
    for (const hab of state.habitaciones) {
      const px = hab.x * T;
      const py = hab.y * T;
      const pw = hab.w * T;
      const ph = hab.h * T;
      const colorZona = hab.color || '#ffd700';
      const texto = escaparXML(hab.nombre);
      const cajaAncho = anchoTextoAprox(hab.nombre) + 12;

      zonas += `
        <rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="none" stroke="${colorZona}" stroke-width="2" />
        <rect x="${px + 3}" y="${py + 3}" width="${cajaAncho}" height="18" fill="rgba(0,0,0,0.85)" stroke="${colorZona}" stroke-width="1" />
        <text x="${px + 9}" y="${py + 16}" fill="${colorZona}" font-size="11" font-weight="bold" font-family="Arial">${texto}</text>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${anchoMundo} ${altoMundo}" width="${anchoMundo}" height="${altoMundo}">
  <rect x="0" y="0" width="${anchoMundo}" height="${altoMundo}" fill="${tema.fondo}" />
  ${celdas}
  ${zonas}
</svg>`;
}