# Estado de integración con Uwazi — Archivo Atlas
## Análisis técnico y hoja de ruta

---

## Diagnóstico: lo que está bien

El módulo `src/api/uwazi.js` tiene la estructura correcta:
- Modo mock / modo real controlado por variable de entorno ✓
- Mapeo de la respuesta real de Uwazi al schema interno ✓
- `fetchEventos()`, `fetchEventoById()`, `fetchRelaciones()` como capa de abstracción ✓
- `colorPorTipo()` y `rangoFechas()` como utilidades puras ✓

El mock es muy rico — 100+ eventos geolocalados en Centroamérica con
tipos, certezas, grupos, relaciones. Buen trabajo.

---

## Diagnóstico: lo que está incompleto o tiene problemas

### Problema 1 — fetchEventoById es ineficiente (CRÍTICO para producción)

Actualmente `fetchEventoById(id)` llama a `fetchEventos()` completo y luego
filtra. En producción con Uwazi real eso significa descargar 200 entidades
para mostrar 1.

**Fix correcto para Uwazi real:**
```js
export async function fetchEventoById(id) {
  if (UWAZI_URL === 'mock') {
    return MOCK_EVENTOS.find(e => e.id === id) || null
  }
  const res = await fetch(`${UWAZI_URL}/api/entities?sharedId=${id}`, {
    headers: { 'Authorization': `Bearer ${UWAZI_TOKEN}` }
  })
  const data = await res.json()
  const e = data.entity
  return {
    id: e.sharedId,
    titulo: e.title,
    tipo: e.metadata?.tipo_evento?.[0]?.value || 'otro',
    // ... mismo mapeo que fetchEventos
  }
}
```

### Problema 2 — fetchRelaciones() no implementado para API real

```js
// Actualmente:
export async function fetchRelaciones() {
  if (UWAZI_URL === 'mock') return MOCK_RELACIONES
  return []  // ← VACÍO en producción
}
```

Uwazi tiene un endpoint de relaciones entre entidades en
`/api/relationships`. El fix:

```js
export async function fetchRelaciones() {
  if (UWAZI_URL === 'mock') return MOCK_RELACIONES
  
  // Uwazi usa "connections" entre entidades
  const res = await fetch(`${UWAZI_URL}/api/search?types[]=evento&includeConnections=true&limit=500`, {
    headers: { 'Authorization': `Bearer ${UWAZI_TOKEN}` }
  })
  const data = await res.json()
  
  return (data.rows || []).flatMap(e =>
    (e.connections || []).map(c => ({
      origen: e._id,
      destino: c.entity,
      tipo: c.template || 'relacion',
      label: c.template || 'vinculado a'
    }))
  ).filter(r => r.origen !== r.destino)
}
```

### Problema 3 — Los campos mock no corresponden a nombres reales de Uwazi

El mapeo en `fetchEventos()` asume estos nombres de campo en Uwazi:
```
e.metadata?.tipo_evento     ← debes crear este field en Uwazi
e.metadata?.fecha           ← debes crear este field
e.metadata?.coordenadas     ← field tipo geolocation en Uwazi
e.metadata?.lugar           ← relación con entidad Lugar
e.metadata?.certeza         ← select con valores: verificado/preliminar/confidencial
e.metadata?.descripcion     ← text field
e.metadata?.personas        ← relación con entidad Persona
e.metadata?.documentos      ← relación con entidad Documento
e.metadata?.caso            ← relación con entidad Caso
e.metadata?.grupo           ← select o relación con Organización
e.metadata?.acceso          ← select: publico/restringido/confidencial
```

**Cuando crees tu Uwazi real, el template "Evento" debe tener exactamente
estos nombres de propiedad.** Los nombres son case-sensitive en Uwazi.

### Problema 4 — Autenticación en Uwazi no implementada

Uwazi requiere login para modificar datos. El token JWT actual es solo
para lectura. Si eventualmente el archivo necesita que colaboradores
suban directamente a Uwazi (y no solo a Supabase), necesitarás:

```js
// src/api/uwaziAuth.js
export async function loginUwazi(username, password) {
  const res = await fetch(`${UWAZI_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  const { token } = await res.json()
  sessionStorage.setItem('uwazi_token', token)
  return token
}
```

Por ahora, dado que Supabase maneja la auth de la app y Uwazi es
read-only para la mayoría de usuarios, esto no es urgente.

### Problema 5 — modelo3d y demo3d son campos mock sin equivalente en Uwazi

Los campos `evento.modelo3d` y `evento.demo3d` son inventados en el mock.
Cuando conectes Uwazi real, el EntityViewerPage necesita saber si una
entidad tiene modelo 3D.

Hay dos estrategias:
1. Añadir un field booleano `tiene_modelo_3d` en el template de Uwazi
2. (Recomendado) Consultar Supabase directamente: si existe una fila en
   `entity_models` para ese entityId, entonces tiene modelo 3D.

La estrategia 2 es mejor porque no mezcla responsabilidades — Uwazi
guarda el contenido documental, Supabase guarda los assets 3D.

---

## Hoja de ruta para conectar Uwazi real

### Paso 1 — Crear la instancia de Uwazi (ya decidiste HURIDOCS)

Contactar a HURIDOCS en uwazi.io → "Try Uwazi" o via email.
Pedir hosting gratuito para organización de DDHH.

### Paso 2 — Crear el template "Evento" en Uwazi con estos fields exactos

Acceder al panel de administración → Settings → Templates → New Template

| Nombre field    | Tipo en Uwazi        | Notas                            |
|-----------------|----------------------|----------------------------------|
| tipo_evento     | Select               | Opciones: los tipos en TIPOS_EVENTO |
| fecha           | Date                 | Fecha del evento                 |
| coordenadas     | Geolocation          | Lat/lon                          |
| lugar           | Relationship → Lugar | O text si no hay entidad Lugar   |
| certeza         | Select               | verificado / preliminar / confidencial |
| descripcion     | Text (long)          | Narrativa del evento             |
| personas        | Relationship → Persona | Multi                          |
| documentos      | Relationship → Documento | Multi                        |
| caso            | Relationship → Caso  | Opcional                         |
| grupo           | Select               | Los grupos colaboradores         |
| acceso          | Select               | publico / restringido / confidencial |

### Paso 3 — Obtener el ID del template "Evento"

En Uwazi, cada template tiene un ID hexadecimal. Necesitas añadirlo:

```js
// En .env.local:
VITE_UWAZI_TEMPLATE_EVENTO=507f1f77bcf86cd799439011  // ejemplo

// En uwazi.js:
const TEMPLATE_EVENTO = import.meta.env.VITE_UWAZI_TEMPLATE_EVENTO

export async function fetchEventos() {
  const res = await fetch(
    `${UWAZI_URL}/api/search?types[]=${TEMPLATE_EVENTO}&limit=200`,
    { headers: { 'Authorization': `Bearer ${UWAZI_TOKEN}` } }
  )
  // ...
}
```

### Paso 4 — Obtener el token JWT de Uwazi

```bash
curl -X POST https://TU-INSTANCIA.uwazi.io/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"TU_PASSWORD"}'
# Responde: { "token": "eyJ..." }
```

Añadir a .env.local:
```
VITE_UWAZI_URL=https://TU-INSTANCIA.uwazi.io
VITE_UWAZI_TOKEN=eyJ...
VITE_UWAZI_TEMPLATE_EVENTO=ID_DEL_TEMPLATE
```

### Paso 5 — Probar la conexión antes de eliminar el mock

En `uwazi.js`, añade un flag temporal para comparar:
```js
// Para testear: pon 'mixed' en vez de 'mock' para ver ambos
const UWAZI_URL = import.meta.env.VITE_UWAZI_URL || 'mock'
```

### Paso 6 — El campo model3d: estrategia recomendada

En EntityViewerPage, cuando se carga el evento, hacer una segunda
consulta a Supabase para saber si existe modelo:

```js
// En EntityViewerPage.jsx, añadir:
const [hasModel, setHasModel] = useState(false)

useEffect(() => {
  getEntityModels(entityId).then(models => {
    setHasModel(models?.length > 0)
  })
}, [entityId])
```

Y en el panel del mapa, pasar `modelo3d: hasModel` dinámicamente
en vez de leerlo del mock.

---

## Resumen de prioridades

| Prioridad | Tarea                                    | Cuándo hacerlo        |
|-----------|------------------------------------------|-----------------------|
| Alta      | Crear template en Uwazi con fields correctos | Cuando tengas instancia |
| Alta      | Añadir VITE_UWAZI_TEMPLATE_EVENTO a .env | Con la instancia      |
| Alta      | Fix fetchEventoById para no cargar todo  | Antes de ir a producción |
| Media     | Implementar fetchRelaciones real         | Fase 2                |
| Media     | Lógica modelo3d desde Supabase           | Ya se puede hacer     |
| Baja      | Auth de escritura en Uwazi              | Solo si colaboradores suben directo a Uwazi |

