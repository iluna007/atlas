import { useRef } from 'react'
import '../styles/map.css'
import { useMap } from '../hooks/useMap.js'
import { MapTimeline } from '../components/MapTimeline.jsx'
import { MapPanel } from '../components/MapPanel.jsx'
import { MapLegend } from '../components/MapLegend.jsx'

export function MapPage() {
  const mapRef = useRef(null)
  const {
    loading,
    contadorText,
    selectedEvent,
    setSelectedEvent,
    fullRange,
    histogramEventos,
    onTimelineChange,
    toggleTipo,
    legend,
    showRelaciones,
    setShowRelaciones,
    showEtiquetas,
    setShowEtiquetas,
    tooltip,
    configError,
  } = useMap(mapRef)

  return (
    <div id="app">
      <div id="map" ref={mapRef} />

      {configError === 'mapbox' && (
        <div className="map-config-error" role="alert">
          <strong>Mapbox no configurado</strong>
          <p>
            Falta la variable <code>VITE_MAPBOX_TOKEN</code> en el build.
            En Netlify: <em>Site configuration → Environment variables</em>,
            añade tu token <code>pk.eyJ…</code> y haz <em>Clear cache and deploy</em>.
          </p>
          <p className="map-config-error__hint">
            En Mapbox, permite la URL <code>https://atlasnic.netlify.app</code> en las restricciones del token.
          </p>
        </div>
      )}

      <header id="header">
        <div className="header-logo">
          <h1>◈ Archivo <span>Atlas</span></h1>
          <p>Explorador espaciotemporal</p>
        </div>
        <div
          id="conteo-wrap"
          className={loading || contadorText === 'cargando…' ? 'loading-pulse' : ''}
        >
          {contadorText}
        </div>
      </header>

      <div id="layer-controls">
        <button
          type="button"
          className={`layer-btn ${showEtiquetas ? 'active' : ''}`}
          title="Mostrar nombres de lugar al acercar"
          onClick={() => setShowEtiquetas(v => !v)}
        >
          ◉ Etiquetas
        </button>
        <button
          type="button"
          className={`layer-btn ${showRelaciones ? 'active' : ''}`}
          title="Mostrar arcos de relación entre eventos"
          onClick={() => setShowRelaciones(v => !v)}
        >
          ⌇ Relaciones
        </button>
      </div>

      <div id="ui-bottom">
        {fullRange.min && fullRange.max && (
          <div id="timeline-container">
            <MapTimeline
              min={fullRange.min}
              max={fullRange.max}
              eventos={histogramEventos}
              onChange={onTimelineChange}
            />
          </div>
        )}
        <MapLegend
          legend={legend}
          onHideTipo={toggleTipo}
          onShowTipo={toggleTipo}
        />
      </div>

      <MapPanel evento={selectedEvent} onClose={() => setSelectedEvent(null)} />

      {tooltip && (
        <div
          id="tooltip"
          className="visible"
          role="tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="tt-tipo">{tooltip.tipo}</div>
          <div className="tt-titulo">{tooltip.titulo}</div>
          <div className="tt-fecha">{tooltip.fecha} · {tooltip.lugar}</div>
          {tooltip.demo3d && <div className="tt-3d">◆ Escena 3D prototipo</div>}
        </div>
      )}
    </div>
  )
}
