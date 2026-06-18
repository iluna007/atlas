/**
 * Falla el build en Netlify/CI si falta VITE_MAPBOX_TOKEN.
 * Vite solo expone variables VITE_* que existen al momento del build.
 */
const token = process.env.VITE_MAPBOX_TOKEN?.trim()
const onNetlify = process.env.NETLIFY === 'true'
const onCi = process.env.CI === 'true'

if (!token || token.includes('XXXXXXXX') || token === 'TU_TOKEN_AQUI') {
  const msg = [
    '',
    '❌ VITE_MAPBOX_TOKEN no está definido o es un placeholder.',
    '',
    'Netlify → Site configuration → Environment variables:',
    '  Key:   VITE_MAPBOX_TOKEN',
    '  Value: pk.eyJ… (tu token público de Mapbox)',
    '  Scopes: Production (y Deploy previews si aplica)',
    '',
    'Luego: Deploys → Trigger deploy → Clear cache and deploy site',
    '',
    'Mapbox → token → URL restrictions → añade https://atlasnic.netlify.app',
    '',
  ].join('\n')

  if (onNetlify || onCi) {
    console.error(msg)
    process.exit(1)
  }

  console.warn(msg)
  console.warn('(Build local continúa; en Netlify esto detendría el deploy.)\n')
}
