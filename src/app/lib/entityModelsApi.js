import { supabase, isSupabaseConfigured } from './supabase'
import { mockSaveModelMeta } from './mockStorage'
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB } from './annotationsApi'

const BUCKET = 'entity-assets'

export { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB }

export async function uploadEntityModel(file, entityId, userId) {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(
      `El archivo supera el límite de ${MAX_UPLOAD_SIZE_MB} MB. Tamaño: ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
    )
  }

  if (!isSupabaseConfigured) {
    const url = URL.createObjectURL(file)
    return mockSaveModelMeta(entityId, {
      id: crypto.randomUUID(),
      entity_id: entityId,
      name: file.name,
      local_url: url,
      created_at: new Date().toISOString(),
    })
  }

  const ext = file.name.slice(file.name.lastIndexOf('.'))
  const path = `${entityId}/${userId}/${crypto.randomUUID()}${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false })

  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('entity_models')
    .insert({
      entity_id: entityId,
      user_id: userId,
      name: file.name,
      storage_path: path,
    })
    .select('id, name, storage_path, created_at')
    .single()

  if (error) throw error
  return data
}

export async function getEntityModels(entityId) {
  if (!isSupabaseConfigured) {
    const { mockGetModels } = await import('./mockStorage')
    return mockGetModels(entityId)
  }

  const { data, error } = await supabase
    .from('entity_models')
    .select('id, name, storage_path, created_at')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getModelFileSignedUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60)
  if (error) throw error
  return data.signedUrl
}
