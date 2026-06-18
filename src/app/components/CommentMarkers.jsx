import { getColorForUserId } from '../lib/userColor'

export function CommentMarkers({ comments, onSelectComment }) {
  const spatial = (comments || []).filter(c => c.kind === 'comment' && c.position)
  if (!spatial.length) return null

  return (
    <group>
      {spatial.map((c) => {
        const color = getColorForUserId(c.user_id)
        return (
          <mesh
            key={c.id}
            position={[c.position.x, c.position.y, c.position.z]}
            onClick={(e) => {
              e.stopPropagation()
              onSelectComment(c)
            }}
          >
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
          </mesh>
        )
      })}
    </group>
  )
}
