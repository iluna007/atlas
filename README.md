# Archivo Atlas

Explorador espaciotemporal basado en mapa. Visualiza entidades georreferenciadas con filtros temporales, panel de detalle y escenas 3D colaborativas por entidad.

**Stack:** Mapbox GL JS · Deck.gl · React · Three.js · Supabase · Vite · JavaScript (ES Modules)

---

## Requisitos

- Node.js 18+
- Token de Mapbox ([account.mapbox.com](https://account.mapbox.com))
- Supabase (opcional, para colaboración multi-usuario en 3D)

---

## Instalación

```bash
npm install
cp .env.example .env.local
```

Edita `.env.local` con al menos `VITE_MAPBOX_TOKEN`.

```bash
npm run dev
```

Abre http://localhost:5173

---

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Vista previa del build |

---

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `VITE_MAPBOX_TOKEN` | Token público de Mapbox |
| `VITE_UWAZI_URL` | URL de instancia Uwazi, o `mock` para datos locales |
| `VITE_UWAZI_TOKEN` | JWT de Uwazi (solo si no usas `mock`) |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (opcional) |
| `VITE_SUPABASE_ANON_KEY` | Clave anon de Supabase (opcional) |

El estilo del mapa se configura en `src/map/initMap.js`.

---

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Mapa espaciotemporal (Vanilla JS + Deck.gl) |
| `/entity/:id/3d` | Visor 3D colaborativo de una entidad |
| `/login` | Inicio de sesión |
| `/register` | Registro de usuario |

---

## Estructura

```
archivo-atlas/
├── index.html
├── vite.config.js
├── supabase/schema.sql
├── SUPABASE_SETUP.md
└── src/
    ├── app/                 # Shell React (router, auth, visor 3D)
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── pages/
    │   ├── components/
    │   ├── contexts/
    │   └── lib/
    ├── map/
    │   └── initMap.js       # Mapa Mapbox + Deck.gl
    ├── api/uwazi.js         # Datos (API o mock)
    ├── layers/events.js     # Capas Deck.gl
    ├── components/          # Timeline, panel del mapa
    └── styles/main.css
```

---

## Componentes del mapa

- **`map/initMap.js`** — Mapbox, Deck.gl, filtros y leyenda
- **`api/uwazi.js`** — Fetch y normalización de entidades
- **`layers/events.js`** — ScatterplotLayer, ArcLayer, TextLayer
- **`components/timeline.js`** — Filtro por rango de fechas
- **`components/panel.js`** — Detalle de entidad + enlace a escena 3D

---

## Visor 3D colaborativo

Inspirado en [mnemonic-model](https://github.com/iluna007/mnemonic-model), adaptado a entidades del archivo:

- Carga de modelos Rhino (`.3dm`) con capas
- Comentarios anclados en coordenadas 3D
- Notas de texto y archivos adjuntos
- Auth y persistencia con Supabase (o `localStorage` en dev)

Setup de Supabase: ver [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

---

## Notas

- `.env.local` está en `.gitignore`.
- Restringe el token de Mapbox por dominio en el dashboard de Mapbox.
