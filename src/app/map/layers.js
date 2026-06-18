/**
 * Capas Deck.gl para el mapa
 */

import { ScatterplotLayer, ArcLayer, TextLayer } from '@deck.gl/layers'
import { colorPorTipo } from '../../api/uwazi.js'

function radiusBase(d) {
  if (d.demo3d) return 750
  return 600
}

export function crearCapasEventos({ eventos, onHover, onClick, hoverId, filterKey = '' }) {
  const base = new ScatterplotLayer({
    id: 'eventos-base',
    data: eventos,
    pickable: true,
    opacity: 0.9,
    stroked: true,
    filled: true,
    radiusMinPixels: 5,
    radiusMaxPixels: 18,
    lineWidthMinPixels: 1,
    getPosition: d => [d.coordenadas.lon, d.coordenadas.lat],
    getRadius: radiusBase,
    getFillColor: d => colorPorTipo(d.tipo, 210),
    getLineColor: d => colorPorTipo(d.tipo, 255),
    getLineWidth: 0.5,
    onHover,
    onClick: ({ object }) => object && onClick(object),
    updateTriggers: {
      getPosition: filterKey,
      getRadius: filterKey,
      getFillColor: filterKey,
      getLineColor: filterKey,
    },
  })

  const hovered = hoverId ? eventos.filter(d => d.id === hoverId) : []
  const highlight = hovered.length
    ? new ScatterplotLayer({
        id: 'eventos-highlight',
        data: hovered,
        pickable: false,
        opacity: 1,
        stroked: true,
        filled: true,
        radiusMinPixels: 5,
        radiusMaxPixels: 22,
        lineWidthMinPixels: 2,
        getPosition: d => [d.coordenadas.lon, d.coordenadas.lat],
        getRadius: () => 900,
        getFillColor: d => colorPorTipo(d.tipo, 255),
        getLineColor: d => colorPorTipo(d.tipo, 255),
        getLineWidth: 2,
        updateTriggers: {
          getFillColor: hoverId,
          getLineColor: hoverId,
        },
      })
    : null

  return highlight ? [base, highlight] : [base]
}

export function crearCapaRelaciones({ relaciones, eventosMap, idsVisibles, visible }) {
  if (!visible || !relaciones.length) return null

  const arcos = relaciones
    .filter(r => idsVisibles?.has(r.origen) && idsVisibles?.has(r.destino))
    .map(r => {
      const origen = eventosMap.get(r.origen)
      const destino = eventosMap.get(r.destino)
      if (!origen?.coordenadas || !destino?.coordenadas) return null
      return {
        ...r,
        sourcePosition: [origen.coordenadas.lon, origen.coordenadas.lat],
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
