import { useEffect, useMemo } from 'react'
import { makeCanvasTexture, SANS } from '../../../../utils/canvasTexture'

const KO = `${SANS}, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif`

/** "아직 만드는 중" 카드 */
function noteTexture() {
  return makeCanvasTexture(768, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f6f2e9'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(60, 50, 40, 0.18)'
    ctx.lineWidth = 2
    ctx.strokeRect(24, 24, w - 48, h - 48)
    ctx.fillStyle = '#26221c'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `600 64px ${KO}`
    ctx.fillText('아직 만드는 중', w / 2, h * 0.42)
    ctx.fillStyle = '#7a6f63'
    ctx.font = `400 30px ${KO}`
    ctx.fillText('준비되면 이 서랍에 채워 둘게요', w / 2, h * 0.6)
    // 도장
    ctx.save()
    ctx.translate(w * 0.8, h * 0.78)
    ctx.rotate(-0.18)
    ctx.strokeStyle = 'rgba(184, 103, 63, 0.75)'
    ctx.fillStyle = 'rgba(184, 103, 63, 0.75)'
    ctx.lineWidth = 4
    ctx.strokeRect(-78, -26, 156, 52)
    ctx.font = `700 28px ${SANS}`
    ctx.fillText('WIP', 0, 2)
    ctx.restore()
  })
}

/** 이스터에그 서랍 ②: "아직 만드는 중" 자리(임시). 카드 한 장 + 빈 봉투 두 장. 원점은 서랍 안쪽 바닥 중앙 */
export default function WorkInProgress({ width, depth }: { width: number; depth: number }) {
  const tex = useMemo(() => noteTexture(), [])
  useEffect(() => () => tex.dispose(), [tex])
  const cw = Math.min(0.48, width * 0.55)
  const ch = cw * (2 / 3)

  return (
    <group>
      {/* 빈 크라프트 봉투 */}
      {[
        [-0.18, -0.12, 0.12],
        [0.2, 0.1, -0.08],
      ].map(([x, z, r], i) => (
        <mesh key={i} position={[x * width, 0.004 + i * 0.002, z * depth]} rotation={[-Math.PI / 2, 0, r]} receiveShadow>
          <planeGeometry args={[cw * 0.9, ch * 0.75]} />
          <meshStandardMaterial color="#c4a37a" roughness={0.9} />
        </mesh>
      ))}
      {/* 카드 */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, -0.04]} receiveShadow>
        <planeGeometry args={[cw, ch]} />
        <meshStandardMaterial map={tex} roughness={0.85} />
      </mesh>
    </group>
  )
}
