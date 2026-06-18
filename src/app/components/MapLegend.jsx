export function MapLegend({ legend, onHideTipo, onShowTipo }) {
  return (
    <div id="legend">
      <div className="legend-title">Capas por tipo</div>
      <p className="legend-hint">Clic para ocultar capa · el número sigue el timeline</p>
      <div id="legend-items">
        {legend.activos.map(({ key, def, count }) => {
          const [r, g, b] = def.color
          return (
            <div
              key={key}
              className={`legend-item${count === 0 ? ' legend-item--empty' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => onHideTipo(key)}
              onKeyDown={(e) => e.key === 'Enter' && onHideTipo(key)}
            >
              <div className="legend-dot" style={{ background: `rgb(${r},${g},${b})` }} />
              <span className="legend-label">{def.label}</span>
              <span className="legend-count">{count}</span>
            </div>
          )
        })}
      </div>
      {legend.ocultos.length > 0 && (
        <div id="legend-hidden" className="legend-hidden">
          <div className="legend-hidden-label">Ocultos — clic para mostrar</div>
          {legend.ocultos.map(({ key, def, count }) => {
            const [r, g, b] = def.color
            return (
              <button
                key={key}
                type="button"
                className="legend-chip"
                onClick={() => onShowTipo(key)}
              >
                <span className="legend-chip-dot" style={{ background: `rgb(${r},${g},${b})` }} />
                {def.label} <span className="legend-chip-count">{count}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
