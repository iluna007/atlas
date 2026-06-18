import { useState } from 'react'

export function CommentModal({ mode, point, comment, onSubmit, onClose }) {
  const [body, setBody] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (mode === 'add' && body.trim()) {
      onSubmit(body.trim())
      setBody('')
    }
  }

  return (
    <div className="comment-modal-backdrop" onClick={onClose}>
      <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="comment-modal__close" onClick={onClose}>×</button>

        {mode === 'add' ? (
          <form onSubmit={handleSubmit}>
            <h3>Nuevo comentario espacial</h3>
            <p className="viewer-muted">
              Posición: ({point?.x?.toFixed(2)}, {point?.y?.toFixed(2)}, {point?.z?.toFixed(2)})
            </p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribe tu comentario…"
              rows={4}
              autoFocus
            />
            <div className="comment-modal__actions">
              <button type="button" onClick={onClose}>Cancelar</button>
              <button type="submit" disabled={!body.trim()}>Guardar</button>
            </div>
          </form>
        ) : (
          <div>
            <h3>Comentario</h3>
            {comment?.display_name && <p><strong>{comment.display_name}</strong></p>}
            {comment?.created_at && (
              <p className="viewer-muted">
                {new Date(comment.created_at).toLocaleString('es')}
              </p>
            )}
            <p>{comment?.body}</p>
            <button type="button" onClick={onClose}>Cerrar</button>
          </div>
        )}
      </div>
    </div>
  )
}
