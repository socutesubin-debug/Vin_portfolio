import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, QuadraticBezierCurve3, TubeGeometry, Vector3, type Mesh } from 'three'

const TURNS = 38
const COIL_R = 0.0075
const WIRE_R = 0.0019
const SAMPLES = 420
const UP = new Vector3(0, 1, 0)

/**
 * 본체와 수화기를 잇는 코일 코드. 두 끝점 사이의 처진 곡선을 따라 나선을 감는다.
 * 감는 횟수가 고정이라 수화기가 멀어지면 코일 간격이 자연스럽게 늘어난다.
 * getEnd는 매 프레임 수화기 쪽 끝점(전화기 기준 좌표)을 돌려준다.
 */
export default function CoilCord({ start, getEnd }: { start: Vector3; getEnd: (out: Vector3) => Vector3 }) {
  const mesh = useRef<Mesh>(null)
  const last = useRef(new Vector3(Infinity, 0, 0))
  const end = useMemo(() => new Vector3(), [])

  const build = (a: Vector3, b: Vector3) => {
    const span = a.distanceTo(b)
    // 가까울수록 많이 처지고, 늘어날수록 팽팽해진다
    const sag = Math.max(0.01, 0.07 - span * 0.12)
    const mid = a.clone().add(b).multiplyScalar(0.5)
    mid.y -= sag
    mid.x -= 0.03
    const base = new QuadraticBezierCurve3(a.clone(), mid, b.clone())
    const pts: Vector3[] = []
    const t = new Vector3()
    const n = new Vector3()
    const bn = new Vector3()
    for (let i = 0; i <= SAMPLES; i++) {
      const u = i / SAMPLES
      const p = base.getPoint(u)
      base.getTangent(u, t)
      n.crossVectors(t, UP)
      if (n.lengthSq() < 1e-6) n.set(1, 0, 0)
      n.normalize()
      bn.crossVectors(t, n).normalize()
      // 양 끝은 감지 않고 곧게 이어지게
      const r = COIL_R * Math.min(1, u / 0.06, (1 - u) / 0.06)
      const th = Math.PI * 2 * TURNS * u
      pts.push(p.addScaledVector(n, Math.cos(th) * r).addScaledVector(bn, Math.sin(th) * r))
    }
    return new TubeGeometry(new CatmullRomCurve3(pts), SAMPLES, WIRE_R, 6, false)
  }

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    getEnd(end)
    // 수화기가 움직일 때만 다시 만든다
    if (end.distanceToSquared(last.current) < 1e-8) return
    last.current.copy(end)
    const old = m.geometry
    m.geometry = build(start, end)
    old.dispose()
  })

  useEffect(() => () => mesh.current?.geometry.dispose(), [])

  return (
    <mesh ref={mesh} castShadow>
      <meshStandardMaterial color="#1d1e22" roughness={0.45} />
    </mesh>
  )
}
