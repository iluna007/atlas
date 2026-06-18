import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js'

export function RhinoModel({ fileUrl, layerVisibility, onLayersReady, onModelClick }) {
  const [object, setObject] = useState(null)
  const layerObjectsRef = useRef({})

  useEffect(() => {
    if (!fileUrl) return

    const loader = new Rhino3dmLoader()
    loader.setLibraryPath('https://unpkg.com/rhino3dm@8.0.1/')

    loader.load(
      fileUrl,
      (obj) => {
        const box = new THREE.Box3().setFromObject(obj)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        obj.position.sub(center)

        const maxAxis = Math.max(size.x, size.y, size.z)
        if (maxAxis > 0) obj.scale.multiplyScalar(2 / maxAxis)

        obj.rotation.x = -Math.PI / 2
        obj.updateMatrixWorld(true)

        const layersMeta = obj.userData?.layers || []
        layerObjectsRef.current = {}
        const layerInfoMap = {}

        obj.traverse((child) => {
          if (!child.isMesh) return
          const layerIndex = child.userData?.attributes?.layerIndex
          if (typeof layerIndex !== 'number') return

          if (!layerObjectsRef.current[layerIndex]) {
            layerObjectsRef.current[layerIndex] = []
          }
          layerObjectsRef.current[layerIndex].push(child)

          if (!layerInfoMap[layerIndex]) {
            const meta = layersMeta[layerIndex] || {}
            layerInfoMap[layerIndex] = {
              index: layerIndex,
              name: meta.name || meta.fullPath || `Capa ${Number(layerIndex) + 1}`,
              visible: meta.visible !== false,
            }
          }
        })

        if (onLayersReady) onLayersReady(Object.values(layerInfoMap).sort((a, b) => a.index - b.index))
        setObject(obj)
      },
      undefined,
      (error) => console.error('Error al cargar el modelo 3DM', error),
    )

    return () => {
      setObject(null)
      layerObjectsRef.current = {}
    }
  }, [fileUrl, onLayersReady])

  useEffect(() => {
    if (!layerVisibility) return
    Object.entries(layerObjectsRef.current).forEach(([index, meshes]) => {
      const visible = layerVisibility[index] !== undefined ? layerVisibility[index] : true
      meshes.forEach((mesh) => { mesh.visible = visible })
    })
  }, [layerVisibility])

  if (!object) return null

  return (
    <primitive
      object={object}
      onClick={onModelClick
        ? (e) => {
            e.stopPropagation()
            onModelClick(e.point)
          }
        : undefined}
    />
  )
}
