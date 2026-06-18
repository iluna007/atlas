import { createClient } from '@supabase/supabase-js'

export const isSupabaseConfigured = !!(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

export const supabase = isSupabaseConfigured
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    )
  : null

if (!isSupabaseConfigured) {
  console.warn(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Se usará almacenamiento local para anotaciones.',
  )
}

export function getAuthErrorMessage(err) {
  const msg = err?.message || ''
  if (
    msg === 'Failed to fetch' ||
    msg.includes('NetworkError') ||
    msg.includes('Load failed') ||
    (err?.name === 'TypeError' && msg.includes('fetch'))
  ) {
    return 'No se pudo conectar al servidor. Comprueba VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local.'
  }
  return msg || 'Error inesperado'
}
