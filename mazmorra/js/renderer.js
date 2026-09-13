import { state } from './state.js';
import { TEMAS, TEMA_POR_DEFECTO } from '../Themes.js';

export function dibujarMapa(ctx, canvas) {
  if (!ctx || !canvas) return;

  const tema = TEMAS[state.temaActual] || TEMAS[TEMA_POR_DEFECTO];

  // Limpieza en coordenadas de pantalla (sin transformar)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = tema.fondo;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(state.camara.x, state.camara.y);
  ctx.scale(state.camara.zoom, state.camara.zoom);

  const T = state.tamanoCasilla;
  const jugador = state.modoJugador;

  // 1. Dibujar Matriz (Muros, Suelos y Elementos)
  for (let y = 0; y < state.ALTO_MAPA; y++) {
    for (let x = 0; x < state.ANCHO_MAPA; x++) {
      let tipo = (state.grid && state.grid[y]) ? state.grid[y][x] : 'muro';
      if (jugador && (tipo === 'enemigo' || tipo === 'trampa')) tipo = 'suelo'; // ocultos para el jugador
      const px = x * T;
      const py = y * T;

      if (tipo === 'muro') {
        ctx.fillStyle = tema.muro;
        ctx.fillRect(px, py, T, T);
        ctx.strokeStyle = tema.muroBorde;
        ctx.strokeRect(px, py, T, T);
      } else {
        ctx.fillStyle = tema.suelo;
        ctx.fillRect(px, py, T, T);
        ctx.strokeStyle = tema.sueloBorde;
        ctx.strokeRect(px, py, T, T);

        if (tipo === 'entrada') dibujarEntrada(ctx, px, py, T, tema);
        else if (tipo === 'salida') dibujarSalida(ctx, px, py, T, tema);
        else if (tipo === 'enemigo') dibujarEnemigo(ctx, px, py, T, tema);
        else if (tipo === 'trampa') dibujarTrampa(ctx, px, py, T, tema);
      }
    }
  }

  // 2. Delimitar y Nombrar Zonas — se omite por completo en Vista de Jugador
  if (jugador) {
    ctx.restore();
    return;
  }

  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'left';

  for (let hab of state.habitaciones) {
    const px = hab.x * T;
    const py = hab.y * T;
    const pw = hab.w * T;
    const ph = hab.h * T;

    const colorZona = hab.color || '#ffd700';
    const esArrastrada = state.arrastrandoZona && state.arrastrandoZona.hab.id === hab.id;

    if (state.zonaSeleccionada === hab.id || esArrastrada) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(px, py, pw, ph);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(px - 1, py - 1, pw + 2, ph + 2);
    }

    ctx.globalAlpha = esArrastrada ? 0.6 : 1;
    ctx.strokeStyle = colorZona;
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    const texto = hab.nombre;
    const anchoTexto = ctx.measureText(texto).width;
    const cajaAncho = anchoTexto + 12;
    const cajaAlto = 18;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(px + 3, py + 3, cajaAncho, cajaAlto);
    ctx.strokeStyle = colorZona;
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 3, py + 3, cajaAncho, cajaAlto);

    ctx.fillStyle = colorZona;
    ctx.fillText(texto, px + 9, py + 16);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function dibujarEntrada(ctx, px, py, T, tema) {
  ctx.fillStyle = tema.entrada;
  ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('IN', px + T / 2, py + T / 2 + 3);
  ctx.textAlign = 'left';
}

function dibujarSalida(ctx, px, py, T, tema) {
  ctx.fillStyle = tema.salida;
  ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('OUT', px + T / 2, py + T / 2 + 3);
  ctx.textAlign = 'left';
}

function dibujarEnemigo(ctx, px, py, T, tema) {
  const cx = px + T / 2;
  const cy = py + T / 2;
  ctx.fillStyle = tema.enemigo;
  ctx.beginPath();
  ctx.arc(cx, cy, T / 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tema.enemigoBorde;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function dibujarTrampa(ctx, px, py, T, tema) {
  ctx.strokeStyle = tema.trampa;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px + 4, py + 4);
  ctx.lineTo(px + T - 4, py + T - 4);
  ctx.moveTo(px + T - 4, py + 4);
  ctx.lineTo(px + 4, py + T - 4);
  ctx.stroke();
}