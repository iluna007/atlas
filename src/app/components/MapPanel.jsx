import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TIPOS_EVENTO } from '../../api/uwazi.js'
import { entityHasModel3d } from '../lib/entityModelsApi.js'

const CERT_LABEL = {
  verificado: { label: 'Verificado', cls: 'cert-v' },
  preliminar: { label: 'Preliminar', cls: 'cert-p' },
  confidencial: { label: 'Confidencial', cls: 'cert-c' },
}

const ACCESO_LABEL = {
  publico: '🌐 Público',
  restringido: '🔒 Restringido',
  confidencial: '🔐 Confidencial',
}

function formatearFecha(str) {
  if (!str) return '—'
  const d = new Date(`${str}T12:00:00`)
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function MapPanel({ evento, onClose }) {
  const [hasUploadedModel, setHasUploadedModel] = useState(false)

  useEffect(() => {
    if (!evento?.id) {
      setHasUploadedModel(false)
      return undefined
    }
    let cancelled = false
    entityHasModel3d(evento.id)
      .then(v => { if (!cancelled) setHasUploadedModel(v) })
      .catch(() => { if (!cancelled) setHasUploadedModel(false) })
    return () => { cancelled = true }
  }, [evento?.id])

  if (!evento) {
    return <div id="panel-container" />
  }

  const tipo = TIPOS_EVENTO[evento.tipo] || TIPOS_EVENTO.otro
  const [r, g, b] = tipo.color
  const cert = CERT_LABEL[evento.certeza] || CERT_LABEL.preliminar
  const uwaziUrl = import.meta.env.VITE_UWAZI_URL
  const showUwaziLink = uwaziUrl && uwaziUrl !== 'mock'
  const show3d = evento.modelo3d || evento.demo3d || hasUploadedModel

  return (
    <div id="panel-container" className="panel-visible">
      <div className="panel-inner">
        <div className="panel-header">
          <div
            className="panel-tipo-badge"
            style={{
              background: `rgba(${r},${g},${b},0.15)`,
              color: `rgb(${r},${g},${b})`,
              borderColor: `rgba(${r},${g},${b},0.4)`,
            }}
          >
            {tipo.label}
          </div>
          <button type="button" className="panel-close" onClick={onClose} aria-label="Cerrar panel">
            ✕
          </button>
        </div>

        <h2 className="panel-titulo">{evento.titulo}</h2>
        <div className="panel-meta">
          <span className="meta-fecha">📅 {formatearFecha(evento.fecha)}</span>
          <span className="meta-lugar">📍 {evento.lugar}</span>
        </div>

        <div className="panel-divider" />
        <p className="panel-desc">{evento.descripcion || 'Sin descripción disponible.'}</p>

        <div className="panel-section">
          <div className="panel-section-label">Estado de verificación</div>
          <span className={`cert-badge ${cert.cls}`}>{cert.label}</span>
        </div>

        {evento.grupo && (
          <div className="panel-section">
            <div className="panel-section-label">Grupo</div>
            <span className="panel-caso">{evento.grupo}</span>
          </div>
        )}

        {evento.personas?.length > 0 && (
          <div className="panel-section">
            <div className="panel-section-label">Personas vinculadas</div>
            <div className="panel-tags">
              {evento.personas.map(p => (
                <span key={p} className="tag-item tag-persona">{p}</span>
              ))}
            </div>
          </div>
        )}

        {evento.documentos?.length > 0 && (
          <div className="panel-section">
            <div className="panel-section-label">Documentos</div>
            <div className="panel-tags">
              {evento.documentos.map(d => (
                <span key={d} className="tag-item tag-doc">📄 {d}</span>
              ))}
            </div>
          </div>
        )}

        <div className="panel-section">
          <div className="panel-section-label">Acceso</div>
          <span className="panel-acceso">{ACCESO_LABEL[evento.acceso] || evento.acceso}</span>
        </div>

        {evento.caso && (
          <div className="panel-section">
            <div className="panel-section-label">Caso / Investigación</div>
            <span className="panel-caso">{evento.caso}</span>
          </div>
        )}

        {showUwaziLink && (
          <div className="panel-uwazi-link">
            <a href={`${uwaziUrl}/entity/${evento.id}`} target="_blank" rel="noreferrer" className="panel-ext-link">
              Ver en Uwazi →
            </a>
          </div>
        )}

        {show3d && (
          <div className="panel-3d-wrap">
            <Link to={`/entity/${evento.id}/3d`} className="panel-3d-link">
              Abrir escena 3D →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
