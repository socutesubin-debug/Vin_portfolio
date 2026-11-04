import { BoxGeometry, Group, Mesh, type Material } from 'three'

/**
 * 서랍 캐비닛 — **임시 형태(코드로 만든 상자)**. FileCabinet01.obj 가 비어 있어 시험판처럼 상자로 만든다.
 *
 * 모델로 바꿀 때는 이 파일만 교체한다. HomeScene 은 아래 Cabinet 인터페이스만 쓴다.
 *   - group: 장면에 넣을 묶음. 위치는 HomeScene 이 정한다(시험판: (40, 0, 0)).
 *   - drawers: 서랍마다 하나의 그룹(위에서부터). 앞으로 나오는 방향은 +z.
 *   - setOpen(i): i번째 서랍만 연다(null 이면 모두 닫음). update(): 매 프레임 서랍을 목표 위치로.
 *
 * 크기(cm): 38 × 69 × 48. 서랍 3개 y = 69 - 11 - i*20, 앞 z = 24.4, 열리면 +30.
 */
export interface Cabinet {
  group: Group
  drawers: Group[]
  setOpen(index: number | null): void
  update(): void
}

export const CABINET = { width: 38, depth: 48, frontZ: 24.4, openDistance: 30, lerp: 0.1 }

export function createCabinet(mats: { white: Material; gray: Material; dark: Material }, topHeight: number): Cabinet {
  const group = new Group()
  const add = (w: number, h: number, d: number, m: Material, x: number, y: number, z: number, parent: Group) => {
    const o = new Mesh(new BoxGeometry(w, h, d), m)
    o.position.set(x, y, z)
    o.castShadow = o.receiveShadow = true
    parent.add(o)
    return o
  }
  const CH = topHeight - 6
  add(CABINET.width, CH, CABINET.depth, mats.white, 0, CH / 2, 0, group)
  const drawers: Group[] = []
  const open: boolean[] = []
  for (let i = 0; i < 3; i++) {
    const d = new Group()
    d.position.set(0, CH - 11 - i * 20, CABINET.frontZ)
    group.add(d)
    add(34, 18, 1.6, mats.white, 0, 0, 0, d) // 앞판
    add(11, 4.4, 0.6, mats.dark, 0, 3, 1.1, d) // 이름표 자리
    add(8, 1.6, 1.6, mats.gray, 0, -3.5, 1.4, d) // 손잡이
    drawers.push(d)
    open.push(false)
  }
  return {
    group,
    drawers,
    setOpen(index) {
      open.forEach((_, i) => (open[i] = i === index))
    },
    update() {
      drawers.forEach((d, i) => {
        const z = CABINET.frontZ + (open[i] ? CABINET.openDistance : 0)
        d.position.z += (z - d.position.z) * CABINET.lerp
      })
    },
  }
}
