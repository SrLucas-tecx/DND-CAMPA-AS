import { state, actualizarDimensiones } from './state.js';
import { initPRNG, generarHabitaciones } from './generator.js';
import { dibujarMapa } from './renderer.js';
import { editarCasilla, habitacionEnCasilla, moverHabitacion } from './editor.js';
import { clienteAGrid, aplicarZoomEnPunto, moverCamara, encajarVista } from './panzoom.js';
import { inicializarHistorial, guardarEstado, deshacer, rehacer } from './history.js';

const canvas = document.getElementById('dungeonCanvas');
const ctx = canvas.getContext('2d');
const canvasSection = document.querySelector('.canvas-section');

const narrativaModal = document.getElementById('narrativaModal');
const modalZonaTitulo = document.getElementById('modalZonaTitulo');
const editorNarrativa = document.getElementById('editorNarrativa');

window.narrativaGlobalTexto = "";

// ---------- Herramientas ----------
window.seleccionarHerramienta = function (herramienta, btnElement) {
  state.herramientaActual = herramienta;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  btnElement.classList.add('active');
};

window.seleccionarZona = function (id) {
  state.zonaSeleccionada = id;
  renderizarEditorZonasUI();
  dibujarMapa(ctx, canvas);
};

// ---------- Modal de narrativa ----------
window.abrirModalNarrativaGeneral = function () {
  state.zonaSeleccionada = null;
  if (modalZonaTitulo) modalZonaTitulo.innerText = "📜 Narrativa General y Secretos de Mazmorra";
  if (editorNarrativa) editorNarrativa.innerHTML = window.narrativaGlobalTexto || "";
  if (narrativaModal) narrativaModal.classList.remove('hidden');
};

window.abrirModalNarrativa = function (id) {
  state.zonaSeleccionada = id;
  const hab = state.habitaciones.find(h => h.id === id);

  if (hab && narrativaModal) {
    if (modalZonaTitulo) modalZonaTitulo.innerText = `📖 Configuración & Notas — ${hab.nombre}`;
    if (editorNarrativa) editorNarrativa.innerHTML = hab.notas || "";
    narrativaModal.classList.remove('hidden');
    renderizarEditorZonasUI();
    dibujarMapa(ctx, canvas);
  }
};

window.cerrarModalNarrativa = function () {
  if (editorNarrativa) {
    if (state.zonaSeleccionada) {
      const hab = state.habitaciones.find(h => h.id === state.zonaSeleccionada);
      if (hab) hab.notas = editorNarrativa.innerHTML;
    } else {
      window.narrativaGlobalTexto = editorNarrativa.innerHTML;
    }
  }
  if (narrativaModal) narrativaModal.classList.add('hidden');
  guardarEstado();
};

window.cambiarColorTexto = function (color) {
  document.execCommand('foreColor', false, color);
};

window.aplicarFormato = function (comando) {
  document.execCommand(comando, false, null);
};

window.actualizarNombreZona = function (id, nuevoNombre) {
  const hab = state.habitaciones.find(h => h.id === id);
  if (hab) {
    hab.nombre = nuevoNombre;
    if (state.zonaSeleccionada === id && modalZonaTitulo) {
      modalZonaTitulo.innerText = `📖 Configuración & Notas — ${hab.nombre}`;
    }
    dibujarMapa(ctx, canvas);
  }
};

window.actualizarColorZona = function (id, nuevoColor) {
  const hab = state.habitaciones.find(h => h.id === id);
  if (hab) {
    hab.color = nuevoColor;
    dibujarMapa(ctx, canvas);
  }
};

window.confirmarEdicionZona = function () {
  guardarEstado();
};

// ---------- Panel lateral de zonas (con buscador) ----------
function renderizarEditorZonasUI() {
  const container = document.getElementById('zonasContainer');
  if (!container) return;
  container.innerHTML = '';

  const filtroInput = document.getElementById('filtroZonas');
  const filtro = filtroInput ? filtroInput.value.trim().toLowerCase() : '';

  const habitacionesFiltradas = filtro
    ? state.habitaciones.filter(h => h.nombre.toLowerCase().includes(filtro))
    : state.habitaciones;

  habitacionesFiltradas.forEach(hab => {
    const esActiva = state.zonaSeleccionada === hab.id;
    const div = document.createElement('div');
    div.className = `zona-item ${esActiva ? 'activa' : ''}`;
    div.style.borderLeft = `5px solid ${hab.color}`;

    div.innerHTML = `
      <input type="color" value="${hab.color}" onchange="actualizarColorZona(${hab.id}, this.value); confirmarEdicionZona()" class="zona-color-input" title="Color de zona">
      <input type="text" value="${hab.nombre}" oninput="actualizarNombreZona(${hab.id}, this.value)" onchange="confirmarEdicionZona()" class="zona-text-input">
      <div class="zona-actions">
        <button onclick="seleccionarZona(${hab.id})" class="btn-zona-activa ${esActiva ? 'active' : ''}">
          ${esActiva ? '🎯 Activa' : 'Ver'}
        </button>
        <button onclick="abrirModalNarrativa(${hab.id})" class="btn-zona-notas">
          📝 Notas
        </button>
      </div>
    `;
    container.appendChild(div);
  });

  if (habitacionesFiltradas.length === 0) {
    container.innerHTML = '<p style="font-size:12px;color:#888;padding:8px;">Sin zonas que coincidan.</p>';
  }
}
window.renderizarEditorZonasUI = renderizarEditorZonasUI;
window.addEventListener('input', (e) => {
  if (e.target && e.target.id === 'filtroZonas') renderizarEditorZonasUI();
});

// ---------- Generación de mazmorra ----------
window.generarNuevaMazmorra = function (semillaManual = null) {
  const anchoChunks = parseInt(document.getElementById('widthInput').value) || 16;
  const altoChunks = parseInt(document.getElementById('heightInput').value) || 12;

  actualizarDimensiones(anchoChunks, altoChunks);

  state.semillaActual = semillaManual || ("campaign-" + Math.floor(Date.now() / 1000));
  const seedInput = document.getElementById('seedInput');
  if (seedInput) seedInput.value = state.semillaActual;

  initPRNG(state.semillaActual);
  const maxCuartos = Math.floor((state.ANCHO_CHUNKS * state.ALTO_CHUNKS) / 5);
  generarHabitaciones(maxCuartos, 3, 5);

  if (state.habitaciones.length > 0) {
    state.zonaSeleccionada = state.habitaciones[0].id;
  }

  ajustarCanvasAContenedor(); // recalcula tamaño y re-encaja la vista al nuevo mapa
  renderizarEditorZonasUI();
  dibujarMapa(ctx, canvas);
  inicializarHistorial();
  actualizarUrlSemilla();
};

// ---------- Favoritos de semilla (localStorage) ----------
const LS_KEY_FAVORITOS = 'mazmorra_semillas_favoritas';
const LS_KEY_RECIENTES = 'mazmorra_semillas_recientes';

function leerLS(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}
function escribirLS(key, valor) {
  try { localStorage.setItem(key, JSON.stringify(valor)); } catch { /* almacenamiento no disponible */ }
}

window.guardarSemillaFavorita = function () {
  const nombre = prompt('Nombre para esta semilla favorita:', state.semillaActual);
  if (!nombre) return;
  const favoritos = leerLS(LS_KEY_FAVORITOS);
  favoritos.unshift({ nombre, semilla: state.semillaActual });
  escribirLS(LS_KEY_FAVORITOS, favoritos.slice(0, 30));
  renderizarListaSemillas();
};

function registrarSemillaReciente(semilla) {
  let recientes = leerLS(LS_KEY_RECIENTES).filter(s => s !== semilla);
  recientes.unshift(semilla);
  escribirLS(LS_KEY_RECIENTES, recientes.slice(0, 10));
  renderizarListaSemillas();
}

function renderizarListaSemillas() {
  const cont = document.getElementById('listaSemillas');
  if (!cont) return;
  const favoritos = leerLS(LS_KEY_FAVORITOS);
  const recientes = leerLS(LS_KEY_RECIENTES);

  let html = '';
  if (favoritos.length) {
    html += '<div class="semillas-subtitulo">⭐ Favoritas</div>';
    favoritos.forEach(f => {
      html += `<button class="semilla-chip" onclick="generarNuevaMazmorra('${f.semilla}')">${f.nombre}</button>`;
    });
  }
  if (recientes.length) {
    html += '<div class="semillas-subtitulo">🕘 Recientes</div>';
    recientes.forEach(s => {
      html += `<button class="semilla-chip" onclick="generarNuevaMazmorra('${s}')">${s}</button>`;
    });
  }
  cont.innerHTML = html || '<p style="font-size:12px;color:#888;">Aún no hay semillas guardadas.</p>';
}

function actualizarUrlSemilla() {
  const url = new URL(window.location.href);
  url.searchParams.set('seed', state.semillaActual);
  window.history.replaceState({}, '', url);
  registrarSemillaReciente(state.semillaActual);
}

// ---------- Canvas híbrido responsive (CSS + recálculo JS a resolución nativa) ----------
function ajustarCanvasAContenedor() {
  if (!canvasSection) return;
  const dpr = window.devicePixelRatio || 1;
  const padding = 40; // debe coincidir con el padding de .canvas-section
  const anchoDisponible = Math.max(100, canvasSection.clientWidth - padding);
  const altoDisponible = Math.max(100, canvasSection.clientHeight - padding);

  canvas.width = Math.floor(anchoDisponible * dpr);
  canvas.height = Math.floor(altoDisponible * dpr);
  canvas.style.width = anchoDisponible + 'px';
  canvas.style.height = altoDisponible + 'px';

  encajarVista(canvas);
  dibujarMapa(ctx, canvas);
}

let resizeTimeout = null;
const resizeObserver = new ResizeObserver(() => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(ajustarCanvasAContenedor, 80);
});
if (canvasSection) resizeObserver.observe(canvasSection);

window.encajarVistaManual = function () {
  encajarVista(canvas);
  dibujarMapa(ctx, canvas);
};

// ---------- Undo / Redo ----------
window.deshacerAccion = function () {
  if (deshacer()) { renderizarEditorZonasUI(); dibujarMapa(ctx, canvas); }
};
window.rehacerAccion = function () {
  if (rehacer()) { renderizarEditorZonasUI(); dibujarMapa(ctx, canvas); }
};

window.addEventListener('keydown', (e) => {
  const ctrlOCmd = e.ctrlKey || e.metaKey;
  if (ctrlOCmd && e.key.toLowerCase() === 'z' && !e.shiftKey) {
    e.preventDefault();
    window.deshacerAccion();
  } else if (ctrlOCmd && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
    e.preventDefault();
    window.rehacerAccion();
  } else if (e.code === 'Space') {
    state.espacioPresionado = true;
    canvas.style.cursor = 'grab';
  }
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    state.espacioPresionado = false;
    canvas.style.cursor = 'crosshair';
  }
});

// ---------- Interacción con el canvas: dibujo, pan y arrastre de zonas ----------
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  aplicarZoomEnPunto(canvas, e.clientX, e.clientY, e.deltaY);
  dibujarMapa(ctx, canvas);
}, { passive: false });

canvas.addEventListener('mousedown', (e) => {
  const debeHacerPan = e.button === 1 || state.espacioPresionado;

  if (debeHacerPan) {
    state.arrastrandoCamara = true;
    state.ultimoPuntero = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = 'grabbing';
    return;
  }

  const { gridX, gridY } = clienteAGrid(canvas, e.clientX, e.clientY);

  if (state.herramientaActual === 'mover_zona') {
    const hab = habitacionEnCasilla(gridX, gridY);
    if (hab) {
      state.arrastrandoZona = { hab, offsetGridX: gridX - hab.x, offsetGridY: gridY - hab.y };
      state.zonaSeleccionada = hab.id;
      renderizarEditorZonasUI();
    }
    return;
  }

  state.estaDibujando = true;
  editarCasilla(gridX, gridY);
  dibujarMapa(ctx, canvas);
});

canvas.addEventListener('mousemove', (e) => {
  if (state.arrastrandoCamara) {
    const dx = e.clientX - state.ultimoPuntero.x;
    const dy = e.clientY - state.ultimoPuntero.y;
    const dpr = window.devicePixelRatio || 1;
    moverCamara(dx * dpr, dy * dpr);
    state.ultimoPuntero = { x: e.clientX, y: e.clientY };
    dibujarMapa(ctx, canvas);
    return;
  }

  if (state.arrastrandoZona) {
    const { gridX, gridY } = clienteAGrid(canvas, e.clientX, e.clientY);
    const { hab, offsetGridX, offsetGridY } = state.arrastrandoZona;
    // Vista previa: solo movemos temporalmente la posición dibujada, sin tocar el grid todavía
    hab.x = Math.max(0, Math.min(gridX - offsetGridX, state.ANCHO_MAPA - hab.w));
    hab.y = Math.max(0, Math.min(gridY - offsetGridY, state.ALTO_MAPA - hab.h));
    dibujarMapa(ctx, canvas);
    return;
  }

  if (state.estaDibujando && (state.herramientaActual === 'muro' || state.herramientaActual === 'suelo')) {
    const { gridX, gridY } = clienteAGrid(canvas, e.clientX, e.clientY);
    editarCasilla(gridX, gridY);
    dibujarMapa(ctx, canvas);
  }
});

window.addEventListener('mouseup', () => {
  if (state.arrastrandoCamara) {
    state.arrastrandoCamara = false;
    canvas.style.cursor = state.espacioPresionado ? 'grab' : 'crosshair';
  }

  if (state.arrastrandoZona) {
    const { hab } = state.arrastrandoZona;
    moverHabitacion(hab, hab.x, hab.y); // consolida la huella en el grid y reconecta pasillos
    state.arrastrandoZona = null;
    dibujarMapa(ctx, canvas);
    guardarEstado();
  }

  if (state.estaDibujando) {
    state.estaDibujando = false;
    guardarEstado();
  }
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------- Arranque ----------
function inicializar() {
  const params = new URLSearchParams(window.location.search);
  const semillaUrl = params.get('seed');
  renderizarListaSemillas();
  window.generarNuevaMazmorra(semillaUrl);
}

inicializar();
