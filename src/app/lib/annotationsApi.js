import { supabase, isSupabaseConfigured } from './supabase'
import { mockGetAnnotations, mockAddAnnotation } from './mockStorage'

const BUCKET = 'entity-assets'

export const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024
export const MAX_UPLOAD_SIZE_MB = 50

export async function upsertMyProfile(userId, displayName) {
  if (!isSupabaseConfigured || !userId) return
  const { error } = await supabase.from('profiles').upsert(
    { id: userId, display_name: displayName || null, updated_at: new Date().toISOString() },
    { onConflict: 'id' },
  )
  if (error) console.warn('upsertMyProfile', error.message)
}

async function getProfilesByIds(ids) {
  if (!isSupabaseConfigured || !ids?.length) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', ids)
  if (error) return []
  return data || []
}

export async function getAnnotationsWithAuthors(entityId) {
  if (!isSupabaseConfigured) {
    return mockGetAnnotations(entityId)
  }

  const { data: rows, error } = await supabase
    .from('entity_annotations')
    .select('id, kind, position, body, file_path, created_at, user_id, model_id')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!rows?.length) return []

  const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))]
  const profiles = await getProfilesByIds(userIds)
  const byId = Object.fromEntries(
    profiles.map(p => [p.id, p.display_name || 'Usuario']),
  )

  return rows.map(r => ({
    ...r,
    display_name: byId[r.user_id] || 'Usuario',
  }))
}

export async function addSpatialComment(entityId, userId, position, body, modelId = null) {
  const payload = {
    kind: 'comment',
    entity_id: entityId,
    user_id: userId,
    position: { x: position.x, y: position.y, z: position.z },
    body: body.trim(),
    model_id: modelId,
  }

  if (!isSupabaseConfigured) {
    return mockAddAnnotation(entityId, {
      ...payload,
      user_id: userId || 'local-user',
      display_name: 'Usuario local',
    })
  }

  const { data, error } = await supabase
    .from('entity_annotations')
    .insert(payload)
    .select('id, kind, position, body, created_at, user_id')
    .single()

  if (error) throw error
  return data
}

export async function addTextNote(entityId, userId, body) {
  const payload = {
    kind: 'text',
    entity_id: entityId,
    user_id: userId,
    body: body.trim(),
  }

  if (!isSupabaseConfigured) {
    return mockAddAnnotation(entityId, {
      ...payload,
      user_id: userId || 'local-user',
      display_name: 'Usuario local',
    })
  }

  const { data, error } = await supabase
    .from('entity_annotations')
    .insert(payload)
    .select('id, kind, body, created_at, user_id')
    .single()

  if (error) throw error
  return data
}

export async function uploadEntityFile(entityId, file, userId) {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(`El archivo supera el límite de ${MAX_UPLOAD_SIZE_MB} MB.`)
  }

  if (!isSupabaseConfigured) {
    return mockAddAnnotation(entityId, {
      kind: 'file',
      user_id: userId || 'local-user',
      display_name: 'Usuario local',
      body: file.name,
      file_path: URL.createObjectURL(file),
    })
  }

  const ext = file.name.slice(file.name.lastIndexOf('.'))
  const path = `${entityId}/${userId}/${crypto.randomUUID()}${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false })

  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('entity_annotations')
    .insert({
      kind: 'file',
      entity_id: entityId,
      user_id: userId,
      body: file.name,
      file_path: path,
    })
    .select('id, kind, body, file_path, created_at, user_id')
    .single()

  if (error) throw error
  return data
}

export async function getFileSignedUrl(filePath) {
  if (!isSupabaseConfigured || filePath.startsWith('blob:')) return filePath
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 60 * 60)
  if (error) throw error
  return data.signedUrl
}
