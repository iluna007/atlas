/**
 * Autenticación de escritura en Uwazi (opcional).
 * La app usa Supabase para colaboración; Uwazi suele ser read-only.
 */

const UWAZI_URL = import.meta.env.VITE_UWAZI_URL || 'mock'

export async function loginUwazi(username, password) {
  if (UWAZI_URL === 'mock') {
    throw new Error('Login Uwazi no disponible en modo mock')
  }

  const res = await fetch(`${UWAZI_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!res.ok) throw new Error(`Login Uwazi falló: ${res.status}`)
  const { token } = await res.json()
  sessionStorage.setItem('uwazi_token', token)
  return token
}

export function getStoredUwaziToken() {
  return sessionStorage.getItem('uwazi_token')
}

export function logoutUwazi() {
  sessionStorage.removeItem('uwazi_token')
}
