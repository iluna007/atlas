import { Edges } from '@react-three/drei'

/** Cubo prototipo Three.js para entidades de arquitectura sin .3dm cargado. */
export function PrototypeCube({ onModelClick }) {
  return (
    <mesh
      onClick={
        onModelClick
          ? (e) => {
              e.stopPropagation()
              onModelClick(e.point)
            }
          : undefined
      }
    >
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshStandardMaterial color="#5b9bd5" metalness={0.15} roughness={0.45} />
      <Edges color="#e6edf3" threshold={15} />
    </mesh>
  )
}
