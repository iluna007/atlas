/**
 * layers.js
 * Definición de capas Deck.gl para el mapa.
 * Cada función devuelve una instancia de capa lista para usar con MapboxOverlay.
 */

import { ScatterplotLayer, ArcLayer, TextLayer } from '@deck.gl/layers'
import { colorPorTipo } from '../api/uwazi.js'

/**
 * Capa principal de eventos — círculos coloreados por tipo
 */
export function crearCapaEventos({ eventos, onHover, onClick, hoverId, filterKey = '' }) {
  return new ScatterplotLayer({
    id: 'eventos',
    data: eventos,
    pickable: true,
    opacity: 0.9,
    stroked: true,
    filled: true,
    radiusMinPixels: 5,
    radiusMaxPixels: 18,
    lineWidthMinPixels: 1,

    getPosition: d => [d.coordenadas.lon, d.coordenadas.lat],
    getRadius: d => {
      if (d.id === hoverId) return 900
      if (d.demo3d) return 750
      return 600
    },
    getFillColor: d => colorPorTipo(d.tipo, d.id === hoverId ? 255 : 210),
    getLineColor: d => colorPorTipo(d.tipo, 255),
    getLineWidth: d => d.id === hoverId ? 2 : 0.5,

    onHover,
    onClick: ({ object }) => object && onClick(object),

    updateTriggers: {
      getPosition: filterKey,
      getRadius: [hoverId, filterKey],
      getFillColor: [hoverId, filterKey],
      getLineColor: filterKey,
      getLineWidth: hoverId,
    },
  })
}

/**
 * Capa de relaciones — arcos entre eventos conectados
 */
export function crearCapaRelaciones({ relaciones, eventosMap, idsVisibles, visible }) {
  if (!visible || !relaciones.length) return null

  const arcos = relaciones
    .filter(r => idsVisibles?.has(r.origen) && idsVisibles?.has(r.destino))
    .map(r => {
      const origen  = eventosMap.get(r.origen)
      const destino = eventosMap.get(r.destino)
      if (!origen?.coordenadas || !destino?.coordenadas) return null
      return {
        ...r,
        sourcePosition: [origen.coordenadas.lon,  origen.coordenadas.lat],
        targetPosition: [destino.coordenadas.lon, destino.coordenadas.lat],
      }
    })
    .filter(Boolean)

  return new ArcLayer({
    id: 'relaciones',
    data: arcos,
    pickable: false,
    getWidth: 1.5,
    getSourcePosition: d => d.sourcePosition,
    getTargetPosition: d => d.targetPosition,
    getSourceColor: [83, 74, 183, 160],
    getTargetColor: [29, 158, 117, 160],
    greatCircle: true,
  })
}

/**
 * Capa de etiquetas — nombres de lugar al hacer zoom
 */
export function crearCapaEtiquetas({ eventos, zoom }) {
  if (zoom < 6) return null

  return new TextLayer({
    id: 'etiquetas',
    data: eventos,
    pickable: false,
    getPosition: d => [d.coordenadas.lon, d.coordenadas.lat],
    getText: d => d.lugar.split(',')[0],
    getSize: 11,
    getColor: [255, 255, 255, 180],
    getPixelOffset: [0, -16],
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 500,
    background: true,
    getBackgroundColor: [0, 0, 0, 120],
    backgroundPadding: [4, 2],
    characterSet: 'auto',
  })
}
