# Configuración de Supabase — Escenas 3D colaborativas

Guía para habilitar autenticación, almacenamiento y anotaciones colaborativas en el visor 3D de entidades.

---

## 1. Crear proyecto

1. Entra en [supabase.com](https://supabase.com) y crea un proyecto.
2. Copia **Project URL** y **anon public key** desde Settings → API.

---

## 2. Variables de entorno

Añade en `.env.local`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Reinicia el servidor de desarrollo tras modificar `.env.local`.

---

## 3. Ejecutar schema SQL

1. Abre **SQL Editor** en el dashboard de Supabase.
2. Pega y ejecuta el contenido de [`supabase/schema.sql`](supabase/schema.sql).

Esto crea:

- `profiles` — nickname visible en anotaciones
- `entity_models` — modelos `.3dm` vinculados a `entity_id`
- `entity_annotations` — comentarios espaciales, notas de texto y archivos

---

## 4. Storage

1. Ve a **Storage → New bucket**.
2. Nombre: `entity-assets`
3. Privado (recomendado).

Políticas sugeridas en Storage → Policies:

- **Insert**: usuarios autenticados, bucket `entity-assets`
- **Select**: usuarios autenticados, bucket `entity-assets`

Límite plan gratuito: **50 MB** por archivo.

---

## 5. Auth

### Email / contraseña

Habilitado por defecto. Registro en `/register`, login en `/login`.

### Google OAuth (opcional)

1. Configura OAuth en Google Cloud Console.
2. Añade redirect URI de Supabase (Auth → Providers → Google).
3. Activa Google en Supabase Auth.

---

## 6. Modo sin Supabase

Si no configuras las variables, la app funciona con:

- Visor 3D local (drag & drop `.3dm`)
- Anotaciones en `localStorage` del navegador
- Sin sincronización entre usuarios

---

## 7. Rutas relacionadas

| Ruta | Descripción |
|------|-------------|
| `/entity/:id/3d` | Visor 3D de una entidad |
| `/login` | Inicio de sesión |
| `/register` | Registro |

Desde el mapa, entidades con `modelo3d: true` muestran el botón **Abrir escena 3D** en el panel lateral.
