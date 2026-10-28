import type { ThreeElements } from '@react-three/fiber'
import { ROOM } from '../../config/layout'

/** 바닥, 뒷벽, 창문(벽에 뚫린 밝은 사각형) */
export default function Room(props: ThreeElements['group']) {
  const { wallZ, floorSize, window: win, colors } = ROOM
  const [wx, wy] = win.center
  const [ww, wh] = win.size
  const frame = 0.05

  return (
    <group {...props}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[floorSize, floorSize]} />
        <meshStandardMaterial color={colors.floor} roughness={0.9} />
      </mesh>

      {/* 뒷벽은 그림자를 만들지 않아 창문 쪽 빛이 방 안으로 들어온다 */}
      <mesh position={[0, floorSize / 4, wallZ]} receiveShadow>
        <planeGeometry args={[floorSize, floorSize / 2]} />
        <meshStandardMaterial color={colors.wall} roughness={0.95} />
      </mesh>

      <group position={[wx, wy, wallZ + 0.003]}>
        <mesh>
          <planeGeometry args={[ww, wh]} />
          <meshBasicMaterial color={colors.window} toneMapped={false} />
        </mesh>
        {/* 창틀 */}
        {[
          [0, wh / 2, ww + frame, frame],
          [0, -wh / 2, ww + frame, frame],
          [-ww / 2, 0, frame, wh],
          [ww / 2, 0, frame, wh],
          [0, 0, frame * 0.6, wh],
        ].map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, 0.015]}>
            <boxGeometry args={[w, h, 0.03]} />
            <meshStandardMaterial color={colors.frame} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
