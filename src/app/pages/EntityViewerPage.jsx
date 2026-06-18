import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useAuth } from '../contexts/AuthContext'
import { fetchEventoById } from '../../api/uwazi.js'
import { RhinoModel } from '../components/RhinoModel'
import { PrototypeCube } from '../components/PrototypeCube'
import { CommentMarkers } from '../components/CommentMarkers'
import { LayerPanel } from '../components/LayerPanel'
import { AnnotationPanel } from '../components/AnnotationPanel'
import { CommentModal } from '../components/CommentModal'
import { ViewerCursorController } from '../components/ViewerCursorController'
import {
  getAnnotationsWithAuthors,
  addSpatialComment,
  addTextNote,
  uploadEntityFile,
} from '../lib/annotationsApi'
import {
  uploadEntityModel,
  getEntityModels,
  getModelFileSignedUrl,
  MAX_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_MB,
} from '../lib/entityModelsApi'
import { isSupabaseConfigured } from '../lib/supabase'

export function EntityViewerPage() {
  const { entityId } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [evento, setEvento] = useState(null)
  const [fileUrl, setFileUrl] = useState(null)
  const [fileName, setFileName] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [annotations, setAnnotations] = useState([])
  const [layers, setLayers] = useState([])
  const [loadingEvento, setLoadingEvento] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [error, setError] = useState('')
  const [addingComment, setAddingComment] = useState(false)
  const [commentModal, setCommentModal] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loadingAnnotations, setLoadingAnnotations] = useState(true)
  const [cursorMode, setCursorMode] = useState(null)

  useEffect(() => {
    setLoadingEvento(true)
    setLoadError(null)
    fetchEventoById(entityId)
      .then(setEvento)
      .catch((err) => {
        setEvento(null)
        setLoadError(err.message || 'Entidad no encontrada')
      })
      .finally(() => setLoadingEvento(false))
  }, [entityId])

  useEffect(() => {
    document.title = evento?.titulo
      ? `${evento.titulo} · Archivo Atlas`
      : 'Archivo Atlas'
  }, [evento])

  const refreshAnnotations = useCallback(() => {
    if (!entityId) return
    setLoadingAnnotations(true)
    getAnnotationsWithAuthors(entityId)
      .then(setAnnotations)
      .catch(() => setAnnotations([]))
      .finally(() => setLoadingAnnotations(false))
  }, [entityId])

  useEffect(() => {
    refreshAnnotations()
  }, [refreshAnnotations])

  useEffect(() => {
    if (!entityId || !evento) return
    // Entidades con cubo demo: no cargar blobs viejos de localStorage (provocan pantalla blanca)
    if (evento.demo3d === 'cube') return

    getEntityModels(entityId).then(async (models) => {
      if (!models?.length) return
      const latest = models[0]
      setFileName(latest.name)
      if (latest.local_url) {
        setFileUrl(latest.local_url)
      } else if (latest.storage_path) {
        const url = await getModelFileSignedUrl(latest.storage_path)
        setFileUrl(url)
      }
    }).catch(() => {})
  }, [entityId, evento])

  const handleFiles = useCallback((files) => {
    const file = files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.3dm')) {
      setError('Selecciona un archivo .3dm de Rhino.')
      return
    }
    setError('')
    setFileName(file.name)
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setFileUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return url
    })
  }, [])

  const handleUploadModel = useCallback(async () => {
    if (!selectedFile) return
    if (isSupabaseConfigured && !user) {
      navigate(`/login?redirect=/entity/${entityId}/3d`)
      return
    }
    setUploading(true)
    setError('')
    try {
      const row = await uploadEntityModel(
        selectedFile,
        entityId,
        user?.id || 'local-user',
      )
      if (row.local_url) setFileUrl(row.local_url)
      else if (row.storage_path) {
        const url = await getModelFileSignedUrl(row.storage_path)
        setFileUrl(url)
      }
      setSelectedFile(null)
    } catch (err) {
      setError(err.message || 'Error al subir el modelo')
    } finally {
      setUploading(false)
    }
  }, [selectedFile, user, entityId, navigate])

  const toggleLayerVisibility = (layerIndex) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.index === layerIndex ? { ...layer, visible: !layer.visible } : layer,
      ),
    )
  }

  const layerVisibilityMap = useMemo(
    () => layers.reduce((acc, layer) => {
      acc[layer.index] = layer.visible
      return acc
    }, {}),
    [layers],
  )

  const handlePlaceComment = useCallback((point) => {
    if (!isAuthenticated && isSupabaseConfigured) {
      navigate(`/login?redirect=/entity/${entityId}/3d`)
      return
    }
    setCommentModal({ type: 'add', point: { x: point.x, y: point.y, z: point.z } })
    setAddingComment(false)
  }, [isAuthenticated, entityId, navigate])

  const handleSubmitNewComment = useCallback(async (body) => {
    if (!commentModal || commentModal.type !== 'add') return
    try {
      await addSpatialComment(
        entityId,
        user?.id || 'local-user',
        commentModal.point,
        body,
      )
      refreshAnnotations()
      setCommentModal(null)
    } catch (err) {
      setError(err.message || 'Error al guardar comentario')
    }
  }, [commentModal, user, entityId, refreshAnnotations])

  const handleAddText = useCallback(async (body) => {
    if (!isAuthenticated && isSupabaseConfigured) {
      navigate(`/login?redirect=/entity/${entityId}/3d`)
      return
    }
    await addTextNote(entityId, user?.id || 'local-user', body)
    refreshAnnotations()
  }, [entityId, user, isAuthenticated, navigate, refreshAnnotations])

  const handleUploadFile = useCallback(async (file) => {
    if (!isAuthenticated && isSupabaseConfigured) {
      navigate(`/login?redirect=/entity/${entityId}/3d`)
      return
    }
    await uploadEntityFile(entityId, file, user?.id || 'local-user')
    refreshAnnotations()
  }, [entityId, user, isAuthenticated, navigate, refreshAnnotations])

  const cursorClass = cursorMode ? `viewer-canvas--${cursorMode}` : ''
  const showDemoCube = (evento?.demo3d === 'cube' || evento?.tipo === 'arquitectura') && !fileUrl
  const hasViewableModel = !!fileUrl || showDemoCube
  const modelClickHandler = addingComment ? handlePlaceComment : undefined

  if (loadError) {
    return (
      <div className="entity-viewer entity-viewer--error">
        <p className="viewer-error">{loadError}</p>
        <Link to="/" className="entity-viewer__back">← Volver al mapa</Link>
      </div>
    )
  }

  return (
    <div className="entity-viewer">
      <header className="entity-viewer__header">
        <Link to="/" className="entity-viewer__back">← Volver al mapa</Link>
        <div className="entity-viewer__title">
          <h1>{loadingEvento ? 'Cargando entidad…' : (evento?.titulo || `Entidad ${entityId}`)}</h1>
          {!loadingEvento && evento?.lugar && <p>{evento.lugar}</p>}
        </div>
        <div className="entity-viewer__auth">
          {isAuthenticated ? (
            <span className="viewer-muted">{user.user_metadata?.display_name || user.email}</span>
          ) : (
            <Link to={`/login?redirect=/entity/${entityId}/3d`}>Iniciar sesión</Link>
          )}
        </div>
      </header>

      <div className="entity-viewer__layout">
        <div className="entity-viewer__sidebar">
          <div className="viewer-panel">
            <h3 className="viewer-panel__title">Modelo 3D</h3>
            {showDemoCube && (
              <p className="viewer-demo-badge">
                Prototipo: cubo Three.js (sin .3dm requerido)
              </p>
            )}
            <div
              className={`dropzone${isDraggingOver ? ' dropzone--active' : ''}`}
              onDrop={(e) => {
                e.preventDefault()
                setIsDraggingOver(false)
                handleFiles(e.dataTransfer.files)
              }}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true) }}
              onDragLeave={() => setIsDraggingOver(false)}
            >
              <p>Arrastra un .3dm aquí</p>
              <label className="btn-file">
                Seleccionar archivo
                <input type="file" accept=".3dm" onChange={(e) => handleFiles(e.target.files)} />
              </label>
              {fileName && <p className="viewer-file-name">{fileName}</p>}
              {selectedFile && selectedFile.size > MAX_UPLOAD_SIZE_BYTES && (
                <p className="viewer-error">Supera {MAX_UPLOAD_SIZE_MB} MB.</p>
              )}
            </div>

            {selectedFile && (
              <button
                type="button"
                className="viewer-btn"
                onClick={handleUploadModel}
                disabled={uploading || selectedFile.size > MAX_UPLOAD_SIZE_BYTES}
              >
                {uploading ? 'Subiendo…' : 'Guardar modelo en entidad'}
              </button>
            )}

            {hasViewableModel && (
              <button
                type="button"
                className={`viewer-btn ${addingComment ? 'viewer-btn--active' : ''}`}
                onClick={() => setAddingComment(a => !a)}
              >
                {addingComment ? 'Clic en el modelo…' : 'Añadir comentario espacial'}
              </button>
            )}

            {error && <p className="viewer-error">{error}</p>}
          </div>

          <LayerPanel layers={layers} onToggle={toggleLayerVisibility} />
        </div>

        <div className={`entity-viewer__canvas ${cursorClass}`}>
          <Canvas
            aria-label={`Modelo 3D de ${evento?.titulo || 'entidad'}`}
            camera={{ position: [2.5, 2.5, 2.5], fov: 50 }}
            gl={{ antialias: true, alpha: false }}
            style={{ background: '#0d1117' }}
          >
            <color attach="background" args={['#0d1117']} />
            <ambientLight intensity={0.65} />
            <directionalLight position={[5, 8, 5]} intensity={1.1} />
            <directionalLight position={[-3, 2, -4]} intensity={0.35} />
            <OrbitControls makeDefault />
            <ViewerCursorController onCursorModeChange={setCursorMode} />
            {loadingEvento ? (
              <mesh>
                <boxGeometry args={[0.3, 0.3, 0.3]} />
                <meshStandardMaterial color="#484f58" wireframe />
              </mesh>
            ) : fileUrl ? (
              <>
                <RhinoModel
                  fileUrl={fileUrl}
                  layerVisibility={layerVisibilityMap}
                  onLayersReady={setLayers}
                  onModelClick={modelClickHandler}
                />
                <CommentMarkers
                  comments={annotations}
                  onSelectComment={(c) => setCommentModal({ type: 'view', comment: c })}
                />
              </>
            ) : showDemoCube ? (
              <>
                <PrototypeCube onModelClick={modelClickHandler} />
                <CommentMarkers
                  comments={annotations}
                  onSelectComment={(c) => setCommentModal({ type: 'view', comment: c })}
                />
              </>
            ) : (
              <mesh>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#534ab7" wireframe />
              </mesh>
            )}
          </Canvas>
        </div>

        <AnnotationPanel
          annotations={annotations}
          loading={loadingAnnotations}
          isAuthenticated={isAuthenticated || !isSupabaseConfigured}
          onAddText={handleAddText}
          onUploadFile={handleUploadFile}
          onSelectComment={(c) => setCommentModal({ type: 'view', comment: c })}
        />
      </div>

      {commentModal && (
        <CommentModal
          mode={commentModal.type === 'add' ? 'add' : 'view'}
          point={commentModal.point}
          comment={commentModal.comment}
          onSubmit={handleSubmitNewComment}
          onClose={() => setCommentModal(null)}
        />
      )}
    </div>
  )
}
