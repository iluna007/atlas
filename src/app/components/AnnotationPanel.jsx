import { useState } from 'react'
import { getColorForUserId } from '../lib/userColor'

export function AnnotationPanel({
  annotations,
  loading,
  isAuthenticated,
  onAddText,
  onUploadFile,
  onSelectComment,
}) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleText = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    try {
      await onAddText(text.trim())
      setText('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSubmitting(true)
    try {
      await onUploadFile(file)
    } finally {
      setSubmitting(false)
      e.target.value = ''
    }
  }

  return (
    <aside className="viewer-panel viewer-panel--annotations">
      <h3 className="viewer-panel__title">Anotaciones</h3>

      {loading && <p className="viewer-muted">Cargando…</p>}

      <div className="annotation-list">
        {annotations.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`annotation-item annotation-item--${a.kind}`}
            onClick={() => a.kind === 'comment' && onSelectComment(a)}
          >
            <span
              className="annotation-item__dot"
              style={{ background: getColorForUserId(a.user_id) }}
            />
            <div className="annotation-item__body">
              <div className="annotation-item__meta">
                <strong>{a.display_name || 'Usuario'}</strong>
                <time>{new Date(a.created_at).toLocaleString('es')}</time>
              </div>
              {a.kind === 'comment' && (
                <p>{a.body}</p>
              )}
              {a.kind === 'text' && <p>{a.body}</p>}
              {a.kind === 'file' && (
                <p className="annotation-item__file">📎 {a.body}</p>
              )}
            </div>
          </button>
        ))}
        {!loading && !annotations.length && (
          <p className="viewer-muted">Sin anotaciones aún.</p>
        )}
      </div>

      <form className="annotation-form" onSubmit={handleText}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nota de texto…"
          rows={3}
          disabled={!isAuthenticated || submitting}
        />
        <div className="annotation-form__actions">
          <button type="submit" disabled={!isAuthenticated || submitting || !text.trim()}>
            Añadir nota
          </button>
          <label className="btn-file">
            Adjuntar
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
              onChange={handleFile}
              disabled={!isAuthenticated || submitting}
            />
          </label>
        </div>
        {!isAuthenticated && (
          <p className="viewer-muted">Inicia sesión para colaborar.</p>
        )}
      </form>
    </aside>
  )
}
