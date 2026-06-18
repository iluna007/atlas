const STORAGE_KEY = 'archivo-atlas-annotations'

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function mockGetAnnotations(entityId) {
  const all = readAll()
  return (all[entityId] || []).sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  )
}

export function mockAddAnnotation(entityId, annotation) {
  const all = readAll()
  const row = {
    id: crypto.randomUUID(),
    entity_id: entityId,
    created_at: new Date().toISOString(),
    display_name: annotation.display_name || 'Usuario local',
    user_id: annotation.user_id || 'local-user',
    ...annotation,
  }
  all[entityId] = [...(all[entityId] || []), row]
  writeAll(all)
  return row
}

export function mockGetModels(entityId) {
  const key = `archivo-atlas-models-${entityId}`
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

export function mockSaveModelMeta(entityId, meta) {
  const key = `archivo-atlas-models-${entityId}`
  const list = mockGetModels(entityId)
  list.unshift(meta)
  localStorage.setItem(key, JSON.stringify(list.slice(0, 5)))
  return meta
}
