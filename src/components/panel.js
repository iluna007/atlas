/**
 * panel.js
 * Panel lateral de detalle de entidad.
 * Se abre al hacer click en un evento del mapa.
 */

import { TIPOS_EVENTO } from '../api/uwazi.js'

const CERT_LABEL = {
  verificado:  { label: 'Verificado',  cls: 'cert-v' },
  preliminar:  { label: 'Preliminar',  cls: 'cert-p' },
  confidencial:{ label: 'Confidencial',cls: 'cert-c' },
}

const ACCESO_LABEL = {
  publico:      '🌐 Público',
  restringido:  '🔒 Restringido',
  confidencial: '🔐 Confidencial',
}

export class Panel {
  constructor(container) {
    this.container = container
    this.visible = false
    this._render()
  }

  _render() {
    this.container.innerHTML = `
      <div class="panel-inner" id="panel-inner">
        <div class="panel-header">
          <div class="panel-tipo-badge" id="panel-tipo"></div>
          <button class="panel-close" id="panel-close" aria-label="Cerrar panel">✕</button>
        </div>
        <h2 class="panel-titulo" id="panel-titulo"></h2>
        <div class="panel-meta" id="panel-meta"></div>
        <div class="panel-divider"></div>
        <p class="panel-desc" id="panel-desc"></p>
        <div class="panel-section" id="panel-certeza-wrap">
          <div class="panel-section-label">Estado de verificación</div>
          <span class="cert-badge" id="panel-certeza"></span>
        </div>
        <div class="panel-section" id="panel-personas-wrap">
          <div class="panel-section-label">Personas vinculadas</div>
          <div id="panel-personas" class="panel-tags"></div>
        </div>
        <div class="panel-section" id="panel-docs-wrap">
          <div class="panel-section-label">Documentos</div>
          <div id="panel-docs" class="panel-tags"></div>
        </div>
        <div class="panel-section">
          <div class="panel-section-label">Acceso</div>
          <span class="panel-acceso" id="panel-acceso"></span>
        </div>
        <div class="panel-section" id="panel-caso-wrap">
          <div class="panel-section-label">Caso / Investigación</div>
          <span class="panel-caso" id="panel-caso"></span>
        </div>
        <div class="panel-uwazi-link" id="panel-uwazi-link" style="display:none">
          <a href="#" target="_blank" id="panel-link" class="panel-ext-link">
            Ver en Uwazi →
          </a>
        </div>
        <div class="panel-3d-wrap" id="panel-3d-wrap" style="display:none">
          <a href="#" id="panel-3d-link" class="panel-3d-link">
            Abrir escena 3D →
          </a>
        </div>
      </div>
    `

    document.querySelector('#panel-close').addEventListener('click', () => this.cerrar())
  }

  abrir(evento) {
    const tipo = TIPOS_EVENTO[evento.tipo] || TIPOS_EVENTO.otro
    const [r, g, b] = tipo.color
    const cert = CERT_LABEL[evento.certeza] || CERT_LABEL.preliminar

    // Badge de tipo
    const badge = document.querySelector('#panel-tipo')
    badge.textContent = tipo.label
    badge.style.background = `rgba(${r},${g},${b},0.15)`
    badge.style.color = `rgb(${r},${g},${b})`
    badge.style.borderColor = `rgba(${r},${g},${b},0.4)`

    // Título y meta
    document.querySelector('#panel-titulo').textContent = evento.titulo
    document.querySelector('#panel-meta').innerHTML = `
      <span class="meta-fecha">📅 ${formatearFecha(evento.fecha)}</span>
      <span class="meta-lugar">📍 ${evento.lugar}</span>
    `

    // Descripción
    document.querySelector('#panel-desc').textContent =
      evento.descripcion || 'Sin descripción disponible.'

    // Certeza
    const certEl = document.querySelector('#panel-certeza')
    certEl.textContent = cert.label
    certEl.className = `cert-badge ${cert.cls}`

    // Personas
    const personasEl = document.querySelector('#panel-personas')
    if (evento.personas?.length) {
      personasEl.innerHTML = evento.personas
        .map(p => `<span class="tag-item tag-persona">${p}</span>`)
        .join('')
      document.querySelector('#panel-personas-wrap').style.display = 'block'
    } else {
      document.querySelector('#panel-personas-wrap').style.display = 'none'
    }

    // Documentos
    const docsEl = document.querySelector('#panel-docs')
    if (evento.documentos?.length) {
      docsEl.innerHTML = evento.documentos
        .map(d => `<span class="tag-item tag-doc">📄 ${d}</span>`)
        .join('')
      document.querySelector('#panel-docs-wrap').style.display = 'block'
    } else {
      document.querySelector('#panel-docs-wrap').style.display = 'none'
    }

    // Acceso
    document.querySelector('#panel-acceso').textContent =
      ACCESO_LABEL[evento.acceso] || evento.acceso

    // Caso
    const casoWrap = document.querySelector('#panel-caso-wrap')
    if (evento.caso) {
      document.querySelector('#panel-caso').textContent = evento.caso
      casoWrap.style.display = 'block'
    } else {
      casoWrap.style.display = 'none'
    }

    // Link escena 3D
    const panel3dWrap = document.querySelector('#panel-3d-wrap')
    if (evento.modelo3d) {
      document.querySelector('#panel-3d-link').href = `/entity/${evento.id}/3d`
      panel3dWrap.style.display = 'block'
    } else {
      panel3dWrap.style.display = 'none'
    }

    // Link a Uwazi real (si hay URL configurada)
    const uwazUrl = import.meta.env.VITE_UWAZI_URL
    if (uwazUrl && uwazUrl !== 'mock') {
      document.querySelector('#panel-link').href =
        `${uwazUrl}/entity/${evento.id}`
      document.querySelector('#panel-uwazi-link').style.display = 'block'
    }

    // Mostrar panel
    this.container.classList.add('panel-visible')
    this.visible = true
  }

  cerrar() {
    this.container.classList.remove('panel-visible')
    this.visible = false
  }

  actualizarConteo(total, filtrados) {
    let el = document.querySelector('#conteo-wrap')
    if (!el) return
    el.textContent = filtrados === total
      ? `${total} eventos`
      : `${filtrados} de ${total} eventos`
  }
}

function formatearFecha(str) {
  if (!str) return '—'
  const d = new Date(str + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
}
