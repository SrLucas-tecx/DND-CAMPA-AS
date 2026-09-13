// Calculadora de Encuentros y Tesoros: usa la "capa" ya asignada a cada sala
// (superficie / medio / profundo) como proxy del nivel de desafío deseado.

const MONSTRUOS_POR_CAPA = {
  superficie: [
    { nombre: 'Bandido novato', nd: '1/8' },
    { nombre: 'Lobo', nd: '1/4' },
    { nombre: 'Kobold explorador', nd: '1/8' },
    { nombre: 'Esqueleto centinela', nd: '1/4' },
    { nombre: 'Rata gigante', nd: '1/8' }
  ],
  medio: [
    { nombre: 'Orco guerrero', nd: '1/2' },
    { nombre: 'Ogro menor', nd: '2' },
    { nombre: 'Araña gigante', nd: '1' },
    { nombre: 'Sacerdote corrupto', nd: '2' },
    { nombre: 'Gnoll cazador', nd: '1/2' }
  ],
  profundo: [
    { nombre: 'Caballero de la muerte menor', nd: '5' },
    { nombre: 'Dragón joven (crío)', nd: '6' },
    { nombre: 'Demonio invocado', nd: '4' },
    { nombre: 'Guardián de piedra', nd: '5' },
    { nombre: 'Nigromante mayor', nd: '6' }
  ]
};

const TESOROS_POR_CAPA = {
  superficie: {
    monedasMin: 5, monedasMax: 40,
    objetos: ['Poción menor de curación', 'Daga oxidada', 'Amuleto de cobre', 'Pergamino en blanco']
  },
  medio: {
    monedasMin: 30, monedasMax: 150,
    objetos: ['Poción de curación', 'Anillo de plata grabado', 'Arma +1 (menor)', 'Pergamino de hechizo de nivel 1']
  },
  profundo: {
    monedasMin: 150, monedasMax: 800,
    objetos: ['Objeto mágico raro', 'Gema de gran valor', 'Arma +2', 'Tomo de conocimiento arcano']
  }
};

// rng es la función pseudoaleatoria semillada de state.rng, para que el resultado
// sea reproducible con la misma semilla de mazmorra (no usa Math.random directamente).
export function generarEncuentro(hab, rng) {
  const azar = typeof rng === 'function' ? rng : Math.random;
  const capa = (hab && hab.capa && MONSTRUOS_POR_CAPA[hab.capa]) ? hab.capa : 'superficie';

  const tablaMonstruos = MONSTRUOS_POR_CAPA[capa];
  const tablaTesoro = TESOROS_POR_CAPA[capa];

  const numMonstruos = 1 + Math.floor(azar() * 3); // entre 1 y 3
  const monstruos = [];
  for (let i = 0; i < numMonstruos; i++) {
    monstruos.push(tablaMonstruos[Math.floor(azar() * tablaMonstruos.length)]);
  }

  const monedas = Math.floor(tablaTesoro.monedasMin + azar() * (tablaTesoro.monedasMax - tablaTesoro.monedasMin));
  const hayObjeto = azar() > 0.45;
  const objeto = hayObjeto ? tablaTesoro.objetos[Math.floor(azar() * tablaTesoro.objetos.length)] : null;

  return { capa, monstruos, monedas, objeto };
}

export function formatearEncuentroHTML(resultado) {
  const listaMonstruos = resultado.monstruos
    .map(m => `${m.nombre} (ND ${m.nd})`)
    .join(', ');

  return `<br><div><b>[ 🎲 ENCUENTRO Y TESORO GENERADO ]</b></div>` +
    `<div><b>Monstruos:</b> ${listaMonstruos}</div>` +
    `<div><b>Monedas:</b> ${resultado.monedas} po</div>` +
    `<div><b>Objeto:</b> ${resultado.objeto || 'Ninguno esta vez.'}</div>`;
}