/**
 * uwazi.js
 * Módulo de conexión con la API de Uwazi.
 *
 * En DEV: usa datos mock locales (UWAZI_URL = 'mock')
 * En PROD: apunta a tu instancia real de Uwazi con token JWT
 *
 * Cambiar en .env:
 *   VITE_UWAZI_URL=https://tu-instancia.uwazi.io
 *   VITE_UWAZI_TOKEN=tu-jwt-token
 */

const UWAZI_URL = import.meta.env.VITE_UWAZI_URL || 'mock'
const UWAZI_TOKEN = import.meta.env.VITE_UWAZI_TOKEN || ''
const TEMPLATE_EVENTO = import.meta.env.VITE_UWAZI_TEMPLATE_EVENTO || 'evento'

function uwaziHeaders() {
  return {
    Authorization: `Bearer ${UWAZI_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

/** Normaliza una entidad de Uwazi al schema interno del atlas */
export function mapUwaziEntity(e) {
  const coords = e.metadata?.coordenadas?.[0]?.value
  return {
    id: e.sharedId || e._id,
    titulo: e.title,
    tipo: e.metadata?.tipo_evento?.[0]?.value || 'otro',
    fecha: e.metadata?.fecha?.[0]?.value?.split('T')[0] || '',
    coordenadas: coords
      ? { lon: coords.lon ?? coords[0], lat: coords.lat ?? coords[1] }
      : null,
    lugar: e.metadata?.lugar?.[0]?.label || e.metadata?.lugar?.[0]?.value || '',
    certeza: e.metadata?.certeza?.[0]?.value || 'preliminar',
    descripcion: e.metadata?.descripcion?.[0]?.value || '',
    personas: (e.metadata?.personas || []).map(p => p.value),
    documentos: (e.metadata?.documentos || []).map(d => d.value),
    caso: e.metadata?.caso?.[0]?.value || null,
    grupo: e.metadata?.grupo?.[0]?.value || e.metadata?.grupo?.[0]?.label || '',
    acceso: e.metadata?.acceso?.[0]?.value || 'restringido',
    modelo3d: false,
  }
}

// ─── Tipos de evento — ajusta según tu taxonomía en Uwazi ───────────────────
export const TIPOS_EVENTO = {
  detencion:     { label: 'Detención / arresto',       color: [226, 75,  74],  orden: 1 },
  desaparicion:  { label: 'Desaparición forzada',      color: [186, 117, 23],  orden: 2 },
  desplazamiento:{ label: 'Desplazamiento / exilio',   color: [83,  74,  183], orden: 3 },
  violencia:     { label: 'Violencia física',          color: [208, 90,  48],  orden: 4 },
  represalia:    { label: 'Represalia / hostigamiento', color: [153, 53,  86],  orden: 5 },
  manifestacion: { label: 'Acción colectiva',          color: [29,  158, 117], orden: 6 },
  arquitectura:  { label: 'Arquitectura',              color: [91,  155, 213], orden: 7 },
  otro:          { label: 'Otro',                      color: [136, 135, 128], orden: 8 },
}

// ─── Generador mock — ~100 eventos distribuidos en Centroamérica ────────────

const LUGARES_CENTROAMERICA = [
  { lugar: 'Ciudad de Guatemala, Guatemala',       lon: -90.513, lat: 14.634 },
  { lugar: 'Antigua Guatemala, Guatemala',         lon: -90.734, lat: 14.559 },
  { lugar: 'Quetzaltenango, Guatemala',            lon: -91.519, lat: 14.835 },
  { lugar: 'Flores, Petén, Guatemala',             lon: -89.893, lat: 16.922 },
  { lugar: 'Escuintla, Guatemala',                 lon: -90.785, lat: 14.305 },
  { lugar: 'Ciudad de Belice, Belice',             lon: -88.196, lat: 17.499 },
  { lugar: 'San Pedro Sula, Honduras',             lon: -88.025, lat: 15.505 },
  { lugar: 'Tegucigalpa, Honduras',                lon: -87.206, lat: 14.072 },
  { lugar: 'La Ceiba, Honduras',                   lon: -86.782, lat: 15.759 },
  { lugar: 'Comayagua, Honduras',                  lon: -87.621, lat: 14.461 },
  { lugar: 'San Salvador, El Salvador',            lon: -89.187, lat: 13.693 },
  { lugar: 'Santa Ana, El Salvador',               lon: -89.559, lat: 13.994 },
  { lugar: 'San Miguel, El Salvador',              lon: -88.177, lat: 13.483 },
  { lugar: 'Sonsonate, El Salvador',               lon: -89.724, lat: 13.720 },
  { lugar: 'Managua, Nicaragua',                   lon: -86.251, lat: 12.136 },
  { lugar: 'León, Nicaragua',                      lon: -86.878, lat: 12.434 },
  { lugar: 'Granada, Nicaragua',                   lon: -85.956, lat: 11.934 },
  { lugar: 'Bluefields, Nicaragua',                lon: -83.388, lat: 12.013 },
  { lugar: 'San José, Costa Rica',                 lon: -84.090, lat: 9.928 },
  { lugar: 'Limón, Costa Rica',                    lon: -83.035, lat: 9.991 },
  { lugar: 'Puntarenas, Costa Rica',               lon: -84.833, lat: 9.976 },
  { lugar: 'Liberia, Costa Rica',                  lon: -85.438, lat: 10.635 },
  { lugar: 'Ciudad de Panamá, Panamá',             lon: -79.519, lat: 8.982 },
  { lugar: 'Colón, Panamá',                        lon: -79.900, lat: 9.355 },
  { lugar: 'David, Chiriquí, Panamá',              lon: -82.431, lat: 8.430 },
  { lugar: 'Santiago, Veraguas, Panamá',           lon: -80.985, lat: 8.097 },
]

const TITULOS_POR_TIPO = {
  detencion: [
    'Detención arbitraria en operativo policial',
    'Arresto de activista comunitario',
    'Retención en punto de control',
    'Detención durante operativo nocturno',
    'Aprehensión sin orden judicial',
  ],
  desaparicion: [
    'Desaparición forzada de defensor de derechos humanos',
    'Persona vista por última vez en custodia estatal',
    'Desaparición tras operativo de seguridad',
    'Desaparición documentada en zona rural',
    'Caso de desaparición sin respuesta institucional',
  ],
  desplazamiento: [
    'Desplazamiento forzado por violencia armada',
    'Exilio interno tras amenazas directas',
    'Huida transfronteriza documentada',
    'Desalojo forzado de comunidad indígena',
    'Migración forzada por persecución política',
  ],
  violencia: [
    'Agresión física contra periodista',
    'Ataque a sede de organización social',
    'Violencia en contexto de protesta',
    'Heridas graves en operativo de represión',
    'Violencia de género vinculada a represión',
  ],
  represalia: [
    'Hostigamiento a familia de víctima',
    'Amenazas contra testigo clave',
    'Vigilancia y acoso a defensor',
    'Represalia tras denuncia pública',
    'Intimidación a colectivo de víctimas',
  ],
  manifestacion: [
    'Marcha reprimida por fuerzas de seguridad',
    'Concentración pacífica dispersada',
    'Bloqueo vial y respuesta estatal',
    'Acción colectiva por memoria histórica',
    'Protesta estudiantil en plaza central',
  ],
  arquitectura: [
    'Edificio comunitario documentado',
    'Intervención arquitectónica en espacio público',
    'Estructura patrimonial en registro',
    'Proyecto habitacional referenciado',
    'Espacio construido vinculado al caso',
  ],
  otro: [
    'Incidente documentado sin clasificación definitiva',
    'Hecho en verificación por el archivo',
    'Registro preliminar de violación de derechos',
    'Evento reportado por red de observadores',
    'Caso abierto en proceso de documentación',
  ],
}

const CERTEZAS = ['verificado', 'preliminar']
const ACCESOS = ['publico', 'restringido', 'confidencial']
const GRUPOS = ['grupo-norte', 'grupo-centro', 'grupo-sur', 'grupo-pacifico', 'grupo-caribe']

function jitter(valor, rango = 0.35) {
  return valor + (Math.random() - 0.5) * rango * 2
}

function fechaAleatoria(desde = 2015, hasta = 2024) {
  const inicio = new Date(desde, 0, 1).getTime()
  const fin = new Date(hasta, 11, 31).getTime()
  return new Date(inicio + Math.random() * (fin - inicio)).toISOString().split('T')[0]
}

function generarMockEventos(cantidad = 100) {
  const tipos = Object.keys(TIPOS_EVENTO).filter(t => t !== 'arquitectura')
  const eventos = []

  for (let i = 0; i < cantidad; i++) {
    const lugar = LUGARES_CENTROAMERICA[i % LUGARES_CENTROAMERICA.length]
    const tipo = tipos[i % tipos.length]
    const titulos = TITULOS_POR_TIPO[tipo]
    const id = `evt-${String(i + 1).padStart(3, '0')}`

    eventos.push({
      id,
      titulo: `${titulos[i % titulos.length]} — ${lugar.lugar.split(',')[0]}`,
      tipo,
      fecha: fechaAleatoria(),
      coordenadas: {
        lon: jitter(lugar.lon, 0.4),
        lat: jitter(lugar.lat, 0.25),
      },
      lugar: lugar.lugar,
      certeza: CERTEZAS[i % CERTEZAS.length],
      descripcion: `Evento documentado en ${lugar.lugar}. Registro del archivo espaciotemporal con información preliminar para verificación.`,
      personas: i % 3 === 0 ? [`pers-${String((i % 12) + 1).padStart(3, '0')}`] : [],
      documentos: i % 2 === 0 ? [`doc-${String((i % 20) + 1).padStart(3, '0')}`] : [],
      caso: i % 4 === 0 ? `caso-${String.fromCharCode(65 + (i % 5))}` : null,
      grupo: GRUPOS[i % GRUPOS.length],
      acceso: ACCESOS[i % ACCESOS.length],
      modelo3d: false,
    })
  }

  return eventos
}

function generarMockRelaciones(eventos) {
  const relaciones = []
  const tiposRel = [
    { tipo: 'precede_exilio', label: 'precedió al desplazamiento de' },
    { tipo: 'patron', label: 'patrón similar a' },
    { tipo: 'mismo_caso', label: 'vinculado al mismo caso que' },
    { tipo: 'temporal', label: 'ocurrió cerca en el tiempo de' },
  ]

  for (let i = 0; i < 18; i++) {
    const origen = eventos[i * 5 % eventos.length]
    const destino = eventos[(i * 5 + 7) % eventos.length]
    if (origen.id === destino.id) continue
    const def = tiposRel[i % tiposRel.length]
    relaciones.push({ origen: origen.id, destino: destino.id, ...def })
  }

  return relaciones
}

/** Dos eventos de arquitectura con cubo 3D por defecto */
const EVENTOS_ARQUITECTURA = [
  {
    id: 'evt-arch-managua',
    titulo: 'Arquitectura — Mercado municipal (prototipo 3D)',
    tipo: 'arquitectura',
    fecha: '2022-04-10',
    coordenadas: { lon: -86.251, lat: 12.136 },
    lugar: 'Managua, Nicaragua',
    certeza: 'verificado',
    descripcion:
      'Entidad arquitectónica en Managua con escena 3D prototipo (cubo Three.js).',
    personas: ['pers-arch-001'],
    documentos: ['doc-arch-001'],
    caso: 'caso-arch-mga',
    grupo: 'grupo-centro',
    acceso: 'publico',
    modelo3d: true,
    demo3d: 'cube',
  },
  {
    id: 'evt-arch-masaya',
    titulo: 'Arquitectura — Teatro de Masaya (prototipo 3D)',
    tipo: 'arquitectura',
    fecha: '2021-11-22',
    coordenadas: { lon: -86.094, lat: 11.974 },
    lugar: 'Masaya, Nicaragua',
    certeza: 'verificado',
    descripcion:
      'Entidad arquitectónica en Masaya con escena 3D prototipo (cubo Three.js).',
    personas: ['pers-arch-002'],
    documentos: ['doc-arch-002'],
    caso: 'caso-arch-msy',
    grupo: 'grupo-centro',
    acceso: 'publico',
    modelo3d: true,
    demo3d: 'cube',
  },
]

const MOCK_EVENTOS = [...EVENTOS_ARQUITECTURA, ...generarMockEventos(100)]
const MOCK_RELACIONES = generarMockRelaciones(MOCK_EVENTOS)

// ─── Funciones de acceso a datos ─────────────────────────────────────────────

/** Obtiene todos los eventos (mock o API real) */
export async function fetchEventos({ page = 0, limit = 200 } = {}) {
  if (UWAZI_URL === 'mock') return MOCK_EVENTOS

  const res = await fetch(
    `${UWAZI_URL}/api/search?types[]=${encodeURIComponent(TEMPLATE_EVENTO)}&page=${page}&limit=${limit}`,
    { headers: uwaziHeaders() },
  )
  if (!res.ok) throw new Error(`Uwazi API error: ${res.status}`)
  const data = await res.json()

  return (data.rows || [])
    .map(mapUwaziEntity)
    .filter(e => e.coordenadas)
}

/** Obtiene un evento por id (mock o API real) */
export async function fetchEventoById(id) {
  if (UWAZI_URL === 'mock') {
    const evento = MOCK_EVENTOS.find(e => e.id === id)
    if (!evento) throw new Error(`Entidad no encontrada: ${id}`)
    return evento
  }

  const res = await fetch(
    `${UWAZI_URL}/api/entities?sharedId=${encodeURIComponent(id)}`,
    { headers: uwaziHeaders() },
  )
  if (!res.ok) throw new Error(`Uwazi API error: ${res.status}`)
  const data = await res.json()
  const entity = data.rows?.[0] || data.entity
  if (!entity) throw new Error(`Entidad no encontrada: ${id}`)
  const mapped = mapUwaziEntity(entity)
  if (!mapped.coordenadas) throw new Error(`Entidad sin coordenadas: ${id}`)
  return mapped
}

/** Obtiene relaciones entre eventos */
export async function fetchRelaciones() {
  if (UWAZI_URL === 'mock') return MOCK_RELACIONES

  const res = await fetch(
    `${UWAZI_URL}/api/search?types[]=${encodeURIComponent(TEMPLATE_EVENTO)}&includeConnections=true&limit=500`,
    { headers: uwaziHeaders() },
  )
  if (!res.ok) throw new Error(`Uwazi API error: ${res.status}`)
  const data = await res.json()

  return (data.rows || [])
    .flatMap(e =>
      (e.connections || []).map(c => ({
        origen: e.sharedId || e._id,
        destino: c.entity,
        tipo: c.template || 'relacion',
        label: c.template || 'vinculado a',
      })),
    )
    .filter(r => r.origen && r.destino && r.origen !== r.destino)
}

/** Devuelve color RGBA para un tipo de evento */
export function colorPorTipo(tipo, alpha = 220) {
  const def = TIPOS_EVENTO[tipo] || TIPOS_EVENTO.otro
  return [...def.color, alpha]
}

/** Devuelve rango de fechas del dataset completo */
export function rangoFechas(eventos) {
  const fechas = eventos.map(e => new Date(e.fecha)).filter(d => !isNaN(d))
  return {
    min: new Date(Math.min(...fechas)),
    max: new Date(Math.max(...fechas)),
  }
}
