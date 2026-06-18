/**
 * Falla el build en Netlify/CI si falta VITE_MAPBOX_TOKEN.
 * (No se puede embeber en config.js — GitHub Push Protection bloquea tokens Mapbox.)
 */
const token = process.env.VITE_MAPBOX_TOKEN?.trim()
const onNetlify = process.env.NETLIFY === 'true'
const onCi = process.env.CI === 'true'

if (!token || token.includes('XXXXXXXX') || token === 'TU_TOKEN_AQUI') {
  const msg = [
    '',
    '❌ VITE_MAPBOX_TOKEN requerido para el build.',
    '',
    'Netlify → Environment variables → VITE_MAPBOX_TOKEN = pk.eyJ…',
    'Luego: Clear cache and deploy',
    '',
  ].join('\n')

  if (onNetlify || onCi) {
    console.error(msg)
    process.exit(1)
  }

  console.warn(msg)
  console.warn('(Build local continúa; crea .env.local para desarrollo.)\n')
}
