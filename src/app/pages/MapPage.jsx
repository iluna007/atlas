import { useEffect } from 'react'
import { initMap, destroyMap } from '../../map/initMap.js'

export function MapPage() {
  useEffect(() => {
    let cancelled = false
    initMap().catch(console.error)
    return () => {
      if (!cancelled) destroyMap()
      cancelled = true
    }
  }, [])

  return (
    <div id="app">
      <div id="map" />
      <header id="header">
        <div className="header-logo">
          <h1>◈ Archivo <span>Atlas</span></h1>
          <p>Explorador espaciotemporal</p>
        </div>
        <div id="conteo-wrap">cargando…</div>
      </header>
      <div id="layer-controls">
        <button type="button" className="layer-btn active" id="btn-etiquetas">
          ◉ Etiquetas
        </button>
        <button type="button" className="layer-btn" id="btn-relaciones">
          ⌇ Relaciones
        </button>
      </div>
      <div id="ui-bottom">
        <div id="timeline-container" />
        <div id="legend">
          <div className="legend-title">Capas por tipo</div>
          <p className="legend-hint">Clic para ocultar capa · el número sigue el timeline</p>
          <div id="legend-items" />
          <div id="legend-hidden" className="legend-hidden" style={{ display: 'none' }} />
        </div>
      </div>
      <div id="panel-container" />
      <div id="tooltip" role="tooltip" />
    </div>
  )
}
