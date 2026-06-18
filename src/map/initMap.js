/**
 * initMap.js — Inicializa el explorador espaciotemporal (Mapbox + Deck.gl)
 */

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapboxOverlay } from '@deck.gl/mapbox'

import '../styles/main.css'
import { fetchEventos, fetchRelaciones, colorPorTipo, rangoFechas, TIPOS_EVENTO } from '../api/uwazi.js'
import { crearCapaEventos, crearCapaRelaciones, crearCapaEtiquetas } from '../layers/events.js'
import { Timeline } from '../components/timeline.js'
import { Panel } from '../components/panel.js'

let cleanupFn = null
let mapGeneration = 0

export async function initMap() {
  const gen = ++mapGeneration

  if (cleanupFn) {
    cleanupFn()
    cleanupFn = null
  }

  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'TU_TOKEN_AQUI'

  const estado = {
    eventosTodos: [],
    eventosFiltrados: [],
    relaciones: [],
    eventosMap: new Map(),
    filtro: {
      desde: null,
      hasta: null,
      tipos: new Set(Object.keys(TIPOS_EVENTO)),
    },
    hover: null,
    capas: {
      relaciones: false,
      etiquetas: true,
    },
    zoom: 4,
  }

  const [eventos, relaciones] = await Promise.all([
    fetchEventos(),
    fetchRelaciones(),
  ])

  if (gen !== mapGeneration) return null

  estado.eventosTodos = eventos
  estado.eventosFiltrados = eventos
  estado.relaciones = relaciones
  estado.eventosMap = new Map(eventos.map(e => [e.id, e]))

  const rango = rangoFechas(eventos)
  estado.filtro.desde = rango.min
  estado.filtro.hasta = rango.max

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ikerluna/cmmp9964u005401rzhlycalmk',
    center: [-85.5, 12.5],
    zoom: 5.5,
    projection: 'mercator',
  })

  map.addControl(new mapboxgl.NavigationControl(), 'top-right')

  const overlay = new MapboxOverlay({ layers: [] })
  map.addControl(overlay)

  const panel = new Panel(document.querySelector('#panel-container'))

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

  renderizarLeyenda(overlay, panel)

  const btnRelaciones = document.querySelector('#btn-relaciones')
  const btnEtiquetas = document.querySelector('#btn-etiquetas')

  const onRelaciones = (e) => {
    estado.capas.relaciones = !estado.capas.relaciones
    e.currentTarget.classList.toggle('active', estado.capas.relaciones)
    renderizarCapas(overlay, panel)
  }
  const onEtiquetas = (e) => {
    estado.capas.etiquetas = !estado.capas.etiquetas
    e.currentTarget.classList.toggle('active', estado.capas.etiquetas)
    renderizarCapas(overlay, panel)
  }

  btnRelaciones?.addEventListener('click', onRelaciones)
  btnEtiquetas?.addEventListener('click', onEtiquetas)

  map.on('mousemove', () => {})

  const onZoom = () => {
    estado.zoom = map.getZoom()
    renderizarCapas(overlay, panel)
  }
  map.on('zoom', onZoom)

  const onLoad = () => actualizarFiltro(overlay, panel)
  map.on('load', onLoad)

  actualizarContador(eventos.length, eventos.length)

  function claveFiltro() {
    return `${estado.eventosFiltrados.length}:${[...estado.filtro.tipos].sort().join(',')}`
  }

  function idsVisibles() {
    return new Set(estado.eventosFiltrados.map(e => e.id))
  }

  function aplicarFiltros() {
    return estado.eventosTodos.filter(e => {
      const fecha = new Date(e.fecha)
      const dentroRango = fecha >= estado.filtro.desde && fecha <= estado.filtro.hasta
      const tipoVisible = estado.filtro.tipos.has(e.tipo)
      return dentroRango && tipoVisible
    })
  }

  function actualizarFiltro(ov, pnl) {
    estado.eventosFiltrados = aplicarFiltros()
    renderizarCapas(ov, pnl)
    actualizarLeyenda(ov, pnl)
    actualizarContador(estado.eventosTodos.length, estado.eventosFiltrados.length)
  }

  function renderizarCapas(ov, pnl) {
    const tooltip = document.querySelector('#tooltip')
    const filterKey = claveFiltro()
    const visibles = idsVisibles()

    const capas = [
      crearCapaEventos({
        eventos: estado.eventosFiltrados,
        hoverId: estado.hover,
        filterKey,
        onHover: ({ object, x, y }) => {
          const nextHover = object?.id || null
          if (nextHover === estado.hover) return

          estado.hover = nextHover
          if (object) {
            const tipo = TIPOS_EVENTO[object.tipo] || TIPOS_EVENTO.otro
            tooltip.innerHTML = `
              <div class="tt-tipo">${tipo.label}</div>
              <div class="tt-titulo">${object.titulo}</div>
              <div class="tt-fecha">${object.fecha} · ${object.lugar.split(',')[0]}</div>
              ${object.demo3d ? '<div class="tt-3d">◆ Escena 3D prototipo</div>' : ''}
            `
            tooltip.style.left = `${x + 12}px`
            tooltip.style.top = `${y - 10}px`
            tooltip.classList.add('visible')
            document.body.style.cursor = 'pointer'
          } else {
            tooltip.classList.remove('visible')
            document.body.style.cursor = ''
          }
          renderizarCapas(ov, pnl)
        },
        onClick: (evento) => pnl.abrir(evento),
      }),
      estado.capas.relaciones
        ? crearCapaRelaciones({
            relaciones: estado.relaciones,
            eventosMap: estado.eventosMap,
            idsVisibles: visibles,
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

    ov.setProps({ layers: capas })
    map.triggerRepaint()
  }

  function conteosPorTipo(eventos) {
    const conteos = {}
    eventos.forEach(e => { conteos[e.tipo] = (conteos[e.tipo] || 0) + 1 })
    return conteos
  }

  function tiposEnDataset() {
    return new Set(estado.eventosTodos.map(e => e.tipo))
  }

  function eventosEnRangoFecha() {
    return estado.eventosTodos.filter(e => {
      const fecha = new Date(e.fecha)
      return fecha >= estado.filtro.desde && fecha <= estado.filtro.hasta
    })
  }

  function crearItemLeyenda(key, def, count) {
    const [r, g, b] = def.color
    const item = document.createElement('div')
    item.className = `legend-item${count === 0 ? ' legend-item--empty' : ''}`
    item.dataset.tipo = key
    item.innerHTML = `
      <div class="legend-dot" style="background:rgb(${r},${g},${b})"></div>
      <span class="legend-label">${def.label}</span>
      <span class="legend-count">${count}</span>
    `
    return item
  }

  function actualizarLeyenda(ov, pnl) {
    const legend = document.querySelector('#legend-items')
    const hiddenWrap = document.querySelector('#legend-hidden')
    if (!legend) return

    const conteosRango = conteosPorTipo(eventosEnRangoFecha())
    const tiposDataset = tiposEnDataset()

    legend.innerHTML = ''
    if (hiddenWrap) {
      hiddenWrap.innerHTML = ''
      hiddenWrap.style.display = 'none'
    }

    const ocultos = []

    Object.entries(TIPOS_EVENTO)
      .sort((a, b) => a[1].orden - b[1].orden)
      .forEach(([key, def]) => {
        if (!tiposDataset.has(key)) return

        const count = conteosRango[key] || 0

        if (estado.filtro.tipos.has(key)) {
          const item = crearItemLeyenda(key, def, count)
          item.addEventListener('click', () => {
            estado.filtro.tipos.delete(key)
            actualizarFiltro(ov, pnl)
          })
          legend.appendChild(item)
        } else {
          ocultos.push({ key, def, count })
        }
      })

    if (hiddenWrap && ocultos.length) {
      hiddenWrap.style.display = 'block'
      const label = document.createElement('div')
      label.className = 'legend-hidden-label'
      label.textContent = 'Ocultos — clic para mostrar'
      hiddenWrap.appendChild(label)

      ocultos.forEach(({ key, def, count }) => {
        const chip = document.createElement('button')
        chip.type = 'button'
        chip.className = 'legend-chip'
        const [r, g, b] = def.color
        chip.innerHTML = `
          <span class="legend-chip-dot" style="background:rgb(${r},${g},${b})"></span>
          ${def.label} <span class="legend-chip-count">${count}</span>
        `
        chip.addEventListener('click', () => {
          estado.filtro.tipos.add(key)
          actualizarFiltro(ov, pnl)
        })
        hiddenWrap.appendChild(chip)
      })
    }
  }

  function renderizarLeyenda(ov, pnl) {
    actualizarLeyenda(ov, pnl)
  }

  function actualizarContador(total, filtrados) {
    const el = document.querySelector('#conteo-wrap')
    if (!el) return
    const enRango = eventosEnRangoFecha().filter(e => estado.filtro.tipos.has(e.tipo)).length
    const totalRango = eventosEnRangoFecha().length
    el.textContent = enRango === totalRango
      ? `${enRango} eventos`
      : `${enRango} / ${totalRango} en rango`
  }

  cleanupFn = () => {
    if (gen !== mapGeneration) return
    btnRelaciones?.removeEventListener('click', onRelaciones)
    btnEtiquetas?.removeEventListener('click', onEtiquetas)
    map.off('zoom', onZoom)
    map.off('load', onLoad)
    map.remove()
  }

  return cleanupFn
}

export function destroyMap() {
  if (cleanupFn) {
    cleanupFn()
    cleanupFn = null
  }
}
