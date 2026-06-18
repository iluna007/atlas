/**
 * timeline.js
 * Control de filtro temporal — slider de rango de fechas.
 * Devuelve el rango [Date, Date] seleccionado cada vez que cambia.
 */

export class Timeline {
  constructor({ container, min, max, onChange }) {
    this.min = min
    this.max = max
    this.onChange = onChange
    this.current = { desde: min, hasta: max }

    this._render(container)
  }

  _msToVal(date) {
    const total = this.max - this.min
    return Math.round(((date - this.min) / total) * 1000)
  }

  _valToDate(val) {
    const total = this.max - this.min
    return new Date(this.min.getTime() + (val / 1000) * total)
  }

  _fmt(date) {
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })
  }

  _render(container) {
    container.innerHTML = `
      <div class="tl-wrap">
        <div class="tl-header">
          <span class="tl-icon">◷</span>
          <span class="tl-title">Filtro temporal</span>
          <button class="tl-reset" id="tl-reset">Restablecer</button>
        </div>
        <div class="tl-labels">
          <span class="tl-date" id="tl-desde">${this._fmt(this.min)}</span>
          <span class="tl-sep">→</span>
          <span class="tl-date" id="tl-hasta">${this._fmt(this.max)}</span>
        </div>
        <div class="tl-track-wrap">
          <div class="tl-track">
            <div class="tl-fill" id="tl-fill"></div>
          </div>
          <input type="range" class="tl-range" id="tl-desde-input"
            min="0" max="1000" step="1" value="0">
          <input type="range" class="tl-range" id="tl-hasta-input"
            min="0" max="1000" step="1" value="1000">
        </div>
      </div>
    `

    this._desdeInput = container.querySelector('#tl-desde-input')
    this._hastaInput = container.querySelector('#tl-hasta-input')
    this._desdeLabel = container.querySelector('#tl-desde')
    this._hastaLabel = container.querySelector('#tl-hasta')
    this._fill = container.querySelector('#tl-fill')

    this._desdeInput.addEventListener('input', () => this._update())
    this._hastaInput.addEventListener('input', () => this._update())
    container.querySelector('#tl-reset').addEventListener('click', () => this._reset())

    this._updateFill()
  }

  _update() {
    let desde = parseInt(this._desdeInput.value)
    let hasta = parseInt(this._hastaInput.value)

    // Evita que se crucen
    if (desde > hasta) {
      if (document.activeElement === this._desdeInput) {
        this._desdeInput.value = hasta
        desde = hasta
      } else {
        this._hastaInput.value = desde
        hasta = desde
      }
    }

    this.current = {
      desde: this._valToDate(desde),
      hasta: this._valToDate(hasta),
    }

    this._desdeLabel.textContent = this._fmt(this.current.desde)
    this._hastaLabel.textContent = this._fmt(this.current.hasta)
    this._updateFill()
    this.onChange(this.current)
  }

  _updateFill() {
    const desde = parseInt(this._desdeInput.value)
    const hasta = parseInt(this._hastaInput.value)
    this._fill.style.left  = `${desde / 10}%`
    this._fill.style.width = `${(hasta - desde) / 10}%`
  }

  _reset() {
    this._desdeInput.value = 0
    this._hastaInput.value = 1000
    this._update()
  }

  /** Actualiza la barra de distribución de eventos en el tiempo */
  setHistograma(eventos) {
    // Calcula bins mensuales para mostrar densidad
    const bins = new Map()
    const total = this.max - this.min

    eventos.forEach(e => {
      const d = new Date(e.fecha)
      if (isNaN(d)) return
      const pos = Math.floor(((d - this.min) / total) * 40)
      bins.set(pos, (bins.get(pos) || 0) + 1)
    })

    const maxBin = Math.max(...bins.values(), 1)
    const existente = document.querySelector('.tl-histo')
    if (existente) existente.remove()

    const histo = document.createElement('div')
    histo.className = 'tl-histo'

    for (let i = 0; i < 40; i++) {
      const bar = document.createElement('div')
      bar.className = 'tl-histo-bar'
      bar.style.height = `${((bins.get(i) || 0) / maxBin) * 100}%`
      histo.appendChild(bar)
    }

    document.querySelector('.tl-track-wrap').prepend(histo)
  }
}
