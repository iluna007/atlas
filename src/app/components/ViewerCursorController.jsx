import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'

export function ViewerCursorController({ onCursorModeChange }) {
  const { gl } = useThree()
  const zoomTimeoutRef = useRef(null)

  useEffect(() => {
    const el = gl.domElement

    const handlePointerDown = (e) => {
      if (e.button === 0) onCursorModeChange('rotate')
      else if (e.button === 2) onCursorModeChange('pan')
    }
    const handlePointerUp = () => onCursorModeChange(null)
    const handlePointerLeave = () => onCursorModeChange(null)
    const handleWheel = () => {
      onCursorModeChange('zoom')
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current)
      zoomTimeoutRef.current = setTimeout(() => onCursorModeChange(null), 180)
    }

    el.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointerup', handlePointerUp)
    el.addEventListener('pointerleave', handlePointerLeave)
    el.addEventListener('wheel', handleWheel, { passive: true })

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)
      el.removeEventListener('pointerleave', handlePointerLeave)
      el.removeEventListener('wheel', handleWheel)
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current)
    }
  }, [gl, onCursorModeChange])

  return null
}
