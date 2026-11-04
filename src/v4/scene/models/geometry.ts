import { BufferGeometry, Float32BufferAttribute, Shape } from 'three'

export type Loop = [number, number][]

/** 둥근 모서리 사각형 둘레 점(반시계, 가운데 원점). seg = 모서리당 분할 수 */
export function roundedRectLoop(w: number, h: number, r: number, seg = 8): Loop {
  const pts: Loop = []
  const hw = w / 2 - r
  const hh = h / 2 - r
  const corners: [number, number, number][] = [
    [hw, -hh, -Math.PI / 2],
    [hw, hh, 0],
    [-hw, hh, Math.PI / 2],
    [-hw, -hh, Math.PI],
  ]
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2)
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
    }
  }
  return pts
}

export function roundedRectShape(w: number, h: number, r: number, seg = 8, dy = 0) {
  const loop = roundedRectLoop(w, h, r, seg)
  const s = new Shape()
  loop.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y + dy) : s.lineTo(x, y + dy)))
  s.closePath()
  return s
}

/**
 * 같은 점 개수의 둘레 고리들을 z 방향으로 이어 붙인 면(로프트).
 * rings: [loop, z, (선택) xy 오프셋]. 앞뒤가 다른 크기면 테이퍼진 몸통이 된다. 법선은 부드럽게 계산.
 */
export function loft(rings: { loop: Loop; z: number; dx?: number; dy?: number }[], flip = false) {
  const n = rings[0].loop.length
  const pos: number[] = []
  const uv: number[] = []
  rings.forEach((r, ri) => {
    r.loop.forEach(([x, y], i) => {
      pos.push(x + (r.dx ?? 0), y + (r.dy ?? 0), r.z)
      uv.push(i / (n - 1), ri / (rings.length - 1))
    })
  })
  const idx: number[] = []
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < n; i++) {
      const a = r * n + i
      const b = r * n + ((i + 1) % n)
      const c = (r + 1) * n + i
      const d = (r + 1) * n + ((i + 1) % n)
      if (flip) idx.push(a, b, c, b, d, c)
      else idx.push(a, c, b, b, c, d)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

