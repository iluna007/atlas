/**
 * Configuración del mapa.
 *
 * El token NO va en el repo (GitHub Push Protection lo bloquea).
 * Dev: .env.local → VITE_MAPBOX_TOKEN=pk.eyJ…
 * Netlify: Site configuration → Environment variables → VITE_MAPBOX_TOKEN
 */
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN?.trim() || ''

export const MAPBOX_STYLE =
  import.meta.env.VITE_MAPBOX_STYLE?.trim() ||
  'mapbox://styles/ikerluna/cmmp9964u005401rzhlycalmk'

export function isMapboxTokenConfigured() {
  const t = MAPBOX_TOKEN
  return Boolean(t) && !t.includes('XXXXXXXX') && t !== 'TU_TOKEN_AQUI'
}
