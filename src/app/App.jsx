import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { MapPage } from './pages/MapPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

const EntityViewerPage = lazy(() =>
  import('./pages/EntityViewerPage').then(m => ({ default: m.EntityViewerPage })),
)

function Loading() {
  return <div className="app-loading">Cargando…</div>
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/entity/:entityId/3d" element={<EntityViewerPage />} />
      </Routes>
    </Suspense>
  )
}
