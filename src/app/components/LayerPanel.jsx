export function LayerPanel({ layers, onToggle }) {
  if (!layers?.length) return null

  return (
    <div className="viewer-panel viewer-panel--layers">
      <h3 className="viewer-panel__title">Capas del modelo</h3>
      <ul className="layer-list">
        {layers.map((layer) => (
          <li key={layer.index} className="layer-list__item">
            <label>
              <input
                type="checkbox"
                checked={layer.visible}
                onChange={() => onToggle(layer.index)}
              />
              {layer.name || `Capa ${layer.index + 1}`}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
