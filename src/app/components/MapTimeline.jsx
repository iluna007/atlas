import { useEffect, useRef } from 'react'

function fmt(date) {
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })
}

export function MapTimeline({ min, max, eventos, onChange }) {
  const desdeRef = useRef(null)
  const hastaRef = useRef(null)
  const fillRef = useRef(null)
  const desdeLabelRef = useRef(null)
  const hastaLabelRef = useRef(null)
  const trackWrapRef = useRef(null)

  const msToVal = (date) => {
    const total = max - min
    return Math.round(((date - min) / total) * 1000)
  }

  const valToDate = (val) => {
    const total = max - min
    return new Date(min.getTime() + (val / 1000) * total)
  }

  const updateFill = () => {
    if (!desdeRef.current || !fillRef.current) return
    const desde = parseInt(desdeRef.current.value, 10)
    const hasta = parseInt(hastaRef.current.value, 10)
    fillRef.current.style.left = `${desde / 10}%`
    fillRef.current.style.width = `${(hasta - desde) / 10}%`
  }

  const emitChange = () => {
    if (!desdeRef.current || !hastaRef.current) return
    let desde = parseInt(desdeRef.current.value, 10)
    let hasta = parseInt(hastaRef.current.value, 10)
    if (desde > hasta) {
      if (document.activeElement === desdeRef.current) {
        desdeRef.current.value = String(hasta)
        desde = hasta
      } else {
        hastaRef.current.value = String(desde)
        hasta = desde
      }
    }
    const range = { desde: valToDate(desde), hasta: valToDate(hasta) }
    if (desdeLabelRef.current) desdeLabelRef.current.textContent = fmt(range.desde)
    if (hastaLabelRef.current) hastaLabelRef.current.textContent = fmt(range.hasta)
    updateFill()
    onChange(range)
  }

  useEffect(() => {
    if (!trackWrapRef.current || !eventos?.length || !min || !max) return
    const bins = new Map()
    const total = max - min
    eventos.forEach(e => {
      const d = new Date(e.fecha)
      if (isNaN(d)) return
      const pos = Math.floor(((d - min) / total) * 40)
      bins.set(pos, (bins.get(pos) || 0) + 1)
    })
    const maxBin = Math.max(...bins.values(), 1)
    const existing = trackWrapRef.current.querySelector('.tl-histo')
    existing?.remove()
    const histo = document.createElement('div')
    histo.className = 'tl-histo'
    for (let i = 0; i < 40; i++) {
      const bar = document.createElement('div')
      bar.className = 'tl-histo-bar'
      bar.style.height = `${((bins.get(i) || 0) / maxBin) * 100}%`
      histo.appendChild(bar)
    }
    trackWrapRef.current.prepend(histo)
  }, [eventos, min, max])

  if (!min || !max) return null

  return (
    <div className="tl-wrap">
      <div className="tl-header">
        <span className="tl-icon">◷</span>
        <span className="tl-title">Filtro temporal</span>
        <button
          type="button"
          className="tl-reset"
          onClick={() => {
            if (desdeRef.current) desdeRef.current.value = '0'
            if (hastaRef.current) hastaRef.current.value = '1000'
            emitChange()
          }}
        >
          Restablecer
        </button>
      </div>
      <p className="tl-hint">Filtra por fechas · los números de capas se ajustan solos</p>
      <div className="tl-labels">
        <span className="tl-date" ref={desdeLabelRef}>{fmt(min)}</span>
        <span className="tl-sep">→</span>
        <span className="tl-date" ref={hastaLabelRef}>{fmt(max)}</span>
      </div>
      <div className="tl-track-wrap" ref={trackWrapRef}>
        <div className="tl-track">
          <div className="tl-fill" ref={fillRef} />
        </div>
        <input
          type="range"
          className="tl-range"
          ref={desdeRef}
          min="0"
          max="1000"
          step="1"
          defaultValue="0"
          onInput={emitChange}
        />
        <input
          type="range"
          className="tl-range"
          ref={hastaRef}
          min="0"
          max="1000"
          step="1"
          defaultValue="1000"
          onInput={emitChange}
        />
      </div>
    </div>
  )
}
