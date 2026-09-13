// Biomas / temáticas visuales: cada preset define la paleta base del mapa.
// Los colores de las zonas (habitaciones) los sigue eligiendo el usuario aparte.

export const TEMAS = {
  calabozo: {
    nombre: '🏰 Calabozo Clásico',
    fondo: '#0d0d11',
    muro: '#18181c',
    muroBorde: '#282830',
    suelo: '#2d2d38',
    sueloBorde: '#383846',
    entrada: '#4caf50',
    salida: '#2196f3',
    enemigo: '#f44336',
    enemigoBorde: '#801010',
    trampa: '#ff9800'
  },
  cuevas: {
    nombre: '🌿 Cuevas Orgánicas',
    fondo: '#0e120d',
    muro: '#241f16',
    muroBorde: '#3a2f1d',
    suelo: '#3c4a30',
    sueloBorde: '#516640',
    entrada: '#8bc34a',
    salida: '#00bcd4',
    enemigo: '#c0392b',
    enemigoBorde: '#5e1a10',
    trampa: '#d4a017'
  },
  alcantarillas: {
    nombre: '💧 Alcantarillas Húmedas',
    fondo: '#0a0f0d',
    muro: '#14201c',
    muroBorde: '#213a32',
    suelo: '#1f3b30',
    sueloBorde: '#2c5245',
    entrada: '#4caf50',
    salida: '#26c6da',
    enemigo: '#8bc34a',
    enemigoBorde: '#33691e',
    trampa: '#795548'
  },
  criptas: {
    nombre: '🔮 Criptas de Obsidiana',
    fondo: '#08060c',
    muro: '#120e1c',
    muroBorde: '#241a38',
    suelo: '#1e1630',
    sueloBorde: '#332450',
    entrada: '#7e57c2',
    salida: '#5c6bc0',
    enemigo: '#e040fb',
    enemigoBorde: '#6a1b9a',
    trampa: '#ff6f00'
  },
  scifi: {
    nombre: '🛰️ Estación Espacial Sci-Fi',
    fondo: '#05080c',
    muro: '#0d1620',
    muroBorde: '#1a2c3d',
    suelo: '#122436',
    sueloBorde: '#1c3a52',
    entrada: '#00e5ff',
    salida: '#76ff03',
    enemigo: '#ff1744',
    enemigoBorde: '#7f0e22',
    trampa: '#ffea00'
  }
};

export const TEMA_POR_DEFECTO = 'calabozo';