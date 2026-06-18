import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapboxOverlay } from '@deck.gl/mapbox'
import {
  fetchEventos,
  fetchRelaciones,
  rangoFechas,
  TIPOS_EVENTO,
} from '../../api/uwazi.js'
import { crearCapasEventos, crearCapaRelaciones, crearCapaEtiquetas } from '../map/layers.js'
import { debounce } from '../lib/debounce.js'

function conteosPorTipo(eventos) {
  const conteos = {}
  eventos.forEach(e => { conteos[e.tipo] = (conteos[e.tipo] || 0) + 1 })
  return conteos
}

function buildLegendState(eventosTodos, filtro, tiposActivos) {
  const enRango = eventosTodos.filter(e => {
    const fecha = new Date(e.fecha)
    return fecha >= filtro.desde && fecha <= filtro.hasta
  })
  const conteos = conteosPorTipo(enRango)
  const tiposDataset = new Set(eventosTodos.map(e => e.tipo))
  const activos = []
  const ocultos = []

  Object.entries(TIPOS_EVENTO)
    .sort((a, b) => a[1].orden - b[1].orden)
    .forEach(([key, def]) => {
      if (!tiposDataset.has(key)) return
      const count = conteos[key] || 0
      const item = { key, def, count }
      if (tiposActivos.has(key)) activos.push(item)
      else ocultos.push(item)
    })

  return { activos, ocultos }
}

function buildContadorText(eventosTodos, filtro, tiposActivos) {
  const enRango = eventosTodos.filter(e => {
    const fecha = new Date(e.fecha)
    return fecha >= filtro.desde && fecha <= filtro.hasta
  })
  const visibles = enRango.filter(e => tiposActivos.has(e.tipo)).length
  const totalRango = enRango.length
  return visibles === totalRango
    ? `${visibles} eventos`
    : `${visibles} / ${totalRango} en rango`
}

export function useMap(mapContainerRef) {
  const [mapReady, setMapReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [contadorText, setContadorText] = useState('cargando…')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [dateRange, setDateRange] = useState({ desde: null, hasta: null })
  const [fullRange, setFullRange] = useState({ min: null, max: null })
  const [histogramEventos, setHistogramEventos] = useState([])
  const [tiposActivos, setTiposActivos] = useState(() => new Set(Object.keys(TIPOS_EVENTO)))
  const [legend, setLegend] = useState({ activos: [], ocultos: [] })
  const [showRelaciones, setShowRelaciones] = useState(false)
  const [showEtiquetas, setShowEtiquetas] = useState(true)
  const [tooltip, setTooltip] = useState(null)

  const engineRef = useRef(null)
  const showRelacionesRef = useRef(showRelaciones)
  const showEtiquetasRef = useRef(showEtiquetas)
  showRelacionesRef.current = showRelaciones
  showEtiquetasRef.current = showEtiquetas

  const toggleTipo = useCallback((key) => {
    setTiposActivos(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const onTimelineChange = useCallback(({ desde, hasta }) => {
    setDateRange({ desde, hasta })
  }, [])

  const debouncedTimelineChange = useMemo(
    () => debounce(onTimelineChange, 150),
    [onTimelineChange],
  )

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    let cancelled = false
    const engine = {
      map: null,
      overlay: null,
      eventosTodos: [],
      eventosFiltrados: [],
      relaciones: [],
      eventosMap: new Map(),
      filtro: { desde: null, hasta: null },
      tiposActivos: new Set(Object.keys(TIPOS_EVENTO)),
      hover: null,
      zoom: 5.5,
    }

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN?.trim()
    if (!mapboxToken || mapboxToken.includes('XXXXXXXX')) {
      setLoading(false)
      setContadorText('token Mapbox no configurado')
      console.error(
        'VITE_MAPBOX_TOKEN no está definido. En Netlify: Site settings → Environment variables → añade VITE_MAPBOX_TOKEN y redeploy.',
      )
      return
    }

    mapboxgl.accessToken = mapboxToken

    function claveFiltro() {
      return `${engine.eventosFiltrados.length}:${[...engine.tiposActivos].sort().join(',')}`
    }

    function aplicarFiltros() {
      return engine.eventosTodos.filter(e => {
        const fecha = new Date(e.fecha)
        const dentroRango = fecha >= engine.filtro.desde && fecha <= engine.filtro.hasta
        return dentroRango && engine.tiposActivos.has(e.tipo)
      })
    }

    function renderCapas() {
      if (!engine.overlay || !engine.map) return
      const filterKey = claveFiltro()
      const visibles = new Set(engine.eventosFiltrados.map(e => e.id))

      const capas = [
        ...crearCapasEventos({
          eventos: engine.eventosFiltrados,
          hoverId: engine.hover,
          filterKey,
          onHover: ({ object, x, y }) => {
            const nextHover = object?.id || null
            if (nextHover === engine.hover) return
            engine.hover = nextHover
            if (object) {
              const tipo = TIPOS_EVENTO[object.tipo] || TIPOS_EVENTO.otro
              setTooltip({
                x: x + 12,
                y: y - 10,
                tipo: tipo.label,
                titulo: object.titulo,
                fecha: object.fecha,
                lugar: object.lugar.split(',')[0],
                demo3d: object.demo3d,
              })
              document.body.style.cursor = 'pointer'
            } else {
              setTooltip(null)
              document.body.style.cursor = ''
            }
            renderCapas()
          },
          onClick: (evento) => setSelectedEvent(evento),
        }),
        showRelacionesRef.current
          ? crearCapaRelaciones({
              relaciones: engine.relaciones,
              eventosMap: engine.eventosMap,
              idsVisibles: visibles,
              visible: true,
            })
          : null,
        showEtiquetasRef.current
          ? crearCapaEtiquetas({ eventos: engine.eventosFiltrados, zoom: engine.zoom })
          : null,
      ].filter(Boolean)

      engine.overlay.setProps({ layers: capas })
      engine.map.triggerRepaint()
    }

    function syncAndRender() {
      engine.eventosFiltrados = aplicarFiltros()
      renderCapas()
      setContadorText(buildContadorText(engine.eventosTodos, engine.filtro, engine.tiposActivos))
      setLegend(buildLegendState(engine.eventosTodos, engine.filtro, engine.tiposActivos))
    }

    engine.syncAndRender = syncAndRender
    engineRef.current = engine

    async function bootstrap() {
      try {
        const [eventos, relaciones] = await Promise.all([
          fetchEventos(),
          fetchRelaciones(),
        ])
        if (cancelled) return

        engine.eventosTodos = eventos
        engine.eventosFiltrados = eventos
        engine.relaciones = relaciones
        engine.eventosMap = new Map(eventos.map(e => [e.id, e]))

        const rango = rangoFechas(eventos)
        engine.filtro.desde = rango.min
        engine.filtro.hasta = rango.max

        setFullRange({ min: rango.min, max: rango.max })
        setDateRange({ desde: rango.min, hasta: rango.max })
        setHistogramEventos(eventos)
        setLoading(false)

        const map = new mapboxgl.Map({
          container,
          style: 'mapbox://styles/ikerluna/cmmp9964u005401rzhlycalmk',
          center: [-85.5, 12.5],
          zoom: 5.5,
          projection: 'mercator',
        })
        engine.map = map
        map.addControl(new mapboxgl.NavigationControl(), 'top-right')

        const overlay = new MapboxOverlay({ layers: [] })
        engine.overlay = overlay
        map.addControl(overlay)

        map.on('mousemove', () => {})
        map.on('zoom', () => {
          engine.zoom = map.getZoom()
          renderCapas()
        })
        map.on('load', () => {
          if (cancelled) return
          setMapReady(true)
          syncAndRender()
        })
      } catch (err) {
        console.error(err)
        setLoading(false)
        setContadorText('error al cargar')
      }
    }

    bootstrap()

    return () => {
      cancelled = true
      engine.map?.remove()
      engineRef.current = null
      setMapReady(false)
    }
  }, [mapContainerRef])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine?.map || !dateRange.desde) return
    engine.filtro.desde = dateRange.desde
    engine.filtro.hasta = dateRange.hasta
    engine.syncAndRender?.()
  }, [dateRange, mapReady])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine?.map) return
    engine.tiposActivos = tiposActivos
    engine.syncAndRender?.()
  }, [tiposActivos, mapReady])

  useEffect(() => {
    engineRef.current?.syncAndRender?.()
  }, [showRelaciones, showEtiquetas, mapReady])

  return {
    mapReady,
    loading,
    contadorText,
    selectedEvent,
    setSelectedEvent,
    fullRange,
    histogramEventos,
    onTimelineChange: debouncedTimelineChange,
    toggleTipo,
    legend,
    showRelaciones,
    setShowRelaciones,
    showEtiquetas,
    setShowEtiquetas,
    tooltip,
  }
}
