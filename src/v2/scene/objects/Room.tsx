import { useEffect, useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { Color } from 'three'
import { ROOM } from '../../config/layout'
import { ACTIVE_LIGHTING, LIGHTING } from '../../config/lighting'
import { oakFloorTexture } from '../textures'

/** 측면 벽이 방문자 쪽으로 이어지는 끝(z) */
const SIDE_FRONT_Z = 4

/**
 * 바닥(오크 마루), 뒷벽(비워 두는 벽), 왼쪽 측면 벽과 큰 창.
 * 측면 벽과 창틀은 그림자를 만들어, 햇살이 창 모양으로만 방 안에 들어온다.
 */
export default function Room(props: ThreeElements['group']) {
  const { wallZ, sideX, wallThickness: T, height: RH, floorSize, window: win, colors } = ROOM
  const [wz, wy] = win.center
  const [ww, wh] = win.size
  const z0 = wz - ww / 2
  const z1 = wz + ww / 2
  const y0 = wy - wh / 2
  const y1 = wy + wh / 2
  const F = win.frame

  const floorMap = useMemo(() => oakFloorTexture(colors.floor, [floorSize / 2, floorSize / 2]), [colors.floor, floorSize])
  useEffect(() => () => floorMap.dispose(), [floorMap])

  const glow = LIGHTING[ACTIVE_LIGHTING].windowGlow
  const glowColor = useMemo(() => new Color(glow.color).multiplyScalar(glow.intensity), [glow])

  // 측면 벽 조각(창 구멍을 남기고): [z중심, y중심, z길이, y높이]
  const sideLen = SIDE_FRONT_Z - wallZ
  const wallPieces: [number, number, number, number][] = [
    [wallZ + sideLen / 2, y0 / 2, sideLen, y0], // 창 아래
    [wallZ + sideLen / 2, (y1 + RH) / 2, sideLen, RH - y1], // 창 위
    [(wallZ + z0) / 2, wy, z0 - wallZ, wh], // 창 뒤쪽
    [(z1 + SIDE_FRONT_Z) / 2, wy, SIDE_FRONT_Z - z1, wh], // 창 앞쪽
  ]
  // 창틀: 바깥 테두리 + 세로 살 1 + 가로 살 1
  const frames: [number, number, number, number][] = [
    [wz, y0 + F / 2, ww, F],
    [wz, y1 - F / 2, ww, F],
    [z0 + F / 2, wy, F, wh],
    [z1 - F / 2, wy, F, wh],
    [wz, wy, F * 0.7, wh],
    [wz, y0 + win.transomAt, ww, F * 0.7],
  ]

  return (
    <group {...props}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[floorSize, floorSize]} />
        <meshStandardMaterial map={floorMap} roughness={0.62} />
      </mesh>

      {/* 뒷벽: 모니터 뒤 여백 */}
      <mesh position={[0, RH / 2, wallZ]} receiveShadow>
        <planeGeometry args={[floorSize, RH]} />
        <meshStandardMaterial color={colors.wall} roughness={0.95} />
      </mesh>

      {/* 왼쪽 측면 벽(창 구멍 남기고) */}
      {wallPieces.map(([z, y, l, h], i) => (
        <mesh key={i} position={[sideX - T / 2, y, z]} castShadow receiveShadow>
          <boxGeometry args={[T, h, l]} />
          <meshStandardMaterial color={colors.wall} roughness={0.95} />
        </mesh>
      ))}

      {/* 창틀(얇게) */}
      {frames.map(([z, y, l, h], i) => (
        <mesh key={i} position={[sideX - T * 0.35, y, z]} castShadow>
          <boxGeometry args={[T * 0.5, h, l]} />
          <meshStandardMaterial color={colors.frame} roughness={0.6} />
        </mesh>
      ))}

      {/* 창밖: 밝고 부드럽게 날아간 빛 면 */}
      <mesh position={[sideX - T - 0.6, wy, wz]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[ww + 1.2, wh + 1.2]} />
        <meshBasicMaterial color={glowColor} toneMapped={false} />
      </mesh>
    </group>
  )
}
