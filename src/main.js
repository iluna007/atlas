/**
 * main.js — Archivo Atlas
 * Explorador espaciotemporal sobre Uwazi
 *
 * Flujo:
 *   1. Carga eventos desde Uwazi (o mock)
 *   2. Inicializa Mapbox + Deck.gl
 *   3. Monta Timeline, Panel y Leyenda
 *   4. Conecta filtros → re-renderiza capas
 */

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapboxOverlay } from '@deck.gl/mapbox'

import './styles/main.css'
import { fetchEventos, fetchRelaciones, colorPorTipo, rangoFechas, TIPOS_EVENTO } from './api/uwazi.js'
import { crearCapaEventos, crearCapaRelaciones, crearCapaEtiquetas } from './layers/events.js'
import { Timeline } from './components/timeline.js'
import { Panel } from './components/panel.js'

// ─── Token Mapbox — pon el tuyo en .env.local ──────────────────────────────
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'TU_TOKEN_AQUI'

// ─── Estado global ─────────────────────────────────────────────────────────
const estado = {
  eventosTodos:    [],
  eventosFiltrados:[],
  relaciones:      [],
  eventosMap:      new Map(),
  filtro: {
    desde:  null,
    hasta:  null,
    tipos:  new Set(Object.keys(TIPOS_EVENTO)),
  },
  hover:     null,
  capas: {
    relaciones: false,
    etiquetas:  true,
  },
  zoom: 4,
}

// ─── Inicialización ─────────────────────────────────────────────────────────
async function init() {
  // 1. Cargar datos
  const [eventos, relaciones] = await Promise.all([
    fetchEventos(),
    fetchRelaciones(),
  ])

  estado.eventosTodos    = eventos
  estado.eventosFiltrados= eventos
  estado.relaciones      = relaciones
  estado.eventosMap      = new Map(eventos.map(e => [e.id, e]))

  const rango = rangoFechas(eventos)
  estado.filtro.desde = rango.min
  estado.filtro.hasta = rango.max

  // 2. Mapa
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ikerluna/cmmp9964u005401rzhlycalmk',
    center: [-85.5, 12.5],
    zoom: 5.5,
    projection: 'mercator',
  })

  map.addControl(new mapboxgl.NavigationControl(), 'top-right')

  // 3. Deck.gl overlay
  const overlay = new MapboxOverlay({ layers: [] })
  map.addControl(overlay)

  // 4. Tooltip
  const tooltip = document.querySelector('#tooltip')

  // 5. Panel lateral
  const panel = new Panel(document.querySelector('#panel-container'))

  // 6. Timeline
  const timeline = new Timeline({
    container: document.querySelector('#timeline-container'),
    min: rango.min,
    max: rango.max,
    onChange: ({ desde, hasta }) => {
      estado.filtro.desde = desde
      estado.filtro.hasta = hasta
      actualizarFiltro(overlay, panel)
    },
  })
  timeline.setHistograma(eventos)

  // 7. Leyenda
  renderizarLeyenda(eventos, overlay, panel)

  // 8. Controles de capas
  document.querySelector('#btn-relaciones').addEventListener('click', (e) => {
    estado.capas.relaciones = !estado.capas.relaciones
    e.currentTarget.classList.toggle('active', estado.capas.relaciones)
    renderizarCapas(overlay, panel)
  })

  document.querySelector('#btn-etiquetas').addEventListener('click', (e) => {
    estado.capas.etiquetas = !estado.capas.etiquetas
    e.currentTarget.classList.toggle('active', estado.capas.etiquetas)
    renderizarCapas(overlay, panel)
  })

  // 9. Hover tooltip
  map.on('mousemove', () => {}) // necesario para activar picking de Deck.gl

  // 10. Actualizar zoom para etiquetas
  map.on('zoom', () => {
    estado.zoom = map.getZoom()
    renderizarCapas(overlay, panel)
  })

  // 11. Render inicial
  map.on('load', () => {
    actualizarFiltro(overlay, panel)
  })

  // Actualizar contador
  actualizarContador(eventos.length, eventos.length)
}

// ─── Filtrado ───────────────────────────────────────────────────────────────
function aplicarFiltros() {
  return estado.eventosTodos.filter(e => {
    const fecha = new Date(e.fecha)
    const dentroRango = fecha >= estado.filtro.desde && fecha <= estado.filtro.hasta
    const tipoVisible = estado.filtro.tipos.has(e.tipo)
    return dentroRango && tipoVisible
  })
}

function actualizarFiltro(overlay, panel) {
  estado.eventosFiltrados = aplicarFiltros()
  renderizarCapas(overlay, panel)
  actualizarContador(estado.eventosTodos.length, estado.eventosFiltrados.length)
}

// ─── Renderizado de capas ───────────────────────────────────────────────────
function renderizarCapas(overlay, panel) {
  const tooltip = document.querySelector('#tooltip')

  const capas = [
    crearCapaEventos({
      eventos: estado.eventosFiltrados,
      hoverId: estado.hover,
      onHover: ({ object, x, y }) => {
        estado.hover = object?.id || null
        if (object) {
          const tipo = TIPOS_EVENTO[object.tipo] || TIPOS_EVENTO.otro
          tooltip.innerHTML = `
            <div class="tt-tipo">${tipo.label}</div>
            <div class="tt-titulo">${object.titulo}</div>
            <div class="tt-fecha">${object.fecha} · ${object.lugar.split(',')[0]}</div>
          `
          tooltip.style.left = `${x + 12}px`
          tooltip.style.top  = `${y - 10}px`
          tooltip.classList.add('visible')
          document.body.style.cursor = 'pointer'
        } else {
          tooltip.classList.remove('visible')
          document.body.style.cursor = ''
        }
        renderizarCapas(overlay, panel)
      },
      onClick: (evento) => {
        panel.abrir(evento)
      },
    }),

    estado.capas.relaciones
      ? crearCapaRelaciones({
          relaciones: estado.relaciones,
          eventosMap: estado.eventosMap,
          visible: true,
        })
      : null,

    estado.capas.etiquetas
      ? crearCapaEtiquetas({
          eventos: estado.eventosFiltrados,
          zoom: estado.zoom,
        })
      : null,

  ].filter(Boolean)

  overlay.setProps({ layers: capas })
}

// ─── Leyenda con filtro por tipo ────────────────────────────────────────────
function renderizarLeyenda(eventos, overlay, panel) {
  const legend = document.querySelector('#legend-items')

  // Cuenta por tipo
  const conteos = {}
  eventos.forEach(e => {
    conteos[e.tipo] = (conteos[e.tipo] || 0) + 1
  })

  Object.entries(TIPOS_EVENTO)
    .sort((a, b) => a[1].orden - b[1].orden)
    .forEach(([key, def]) => {
      if (!conteos[key]) return
      const [r, g, b] = def.color
      const item = document.createElement('div')
      item.className = 'legend-item active'
      item.dataset.tipo = key
      item.innerHTML = `
        <div class="legend-dot" style="background:rgb(${r},${g},${b})"></div>
        <span class="legend-label">${def.label}</span>
        <span class="legend-count">${conteos[key]}</span>
      `
      item.addEventListener('click', () => {
        if (estado.filtro.tipos.has(key)) {
          estado.filtro.tipos.delete(key)
          item.classList.add('hidden')
        } else {
          estado.filtro.tipos.add(key)
          item.classList.remove('hidden')
        }
        actualizarFiltro(overlay, panel)
      })
      legend.appendChild(item)
    })
}

// ─── Contador de eventos ────────────────────────────────────────────────────
function actualizarContador(total, filtrados) {
  const el = document.querySelector('#conteo-wrap')
  if (!el) return
  el.textContent = filtrados === total
    ? `${total} eventos`
    : `${filtrados} / ${total} eventos`
}

// ─── Arrancar ──────────────────────────────────────────────────────────────
init().catch(console.error)
