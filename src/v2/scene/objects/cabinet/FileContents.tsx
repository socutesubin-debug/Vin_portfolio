import { useEffect, useMemo } from 'react'
import { CATEGORIES, PROJECTS, type Category, type Project } from '../../../data/projects'
import ProjectCard, { CARD_THICKNESS } from './ProjectCard'
import { tabTexture } from './materials'

interface Props {
  drawerIndex: number
  /** 서랍 안쪽 폭·깊이·높이(참고 디자인 단위). 원점은 바닥 중앙 */
  width: number
  depth: number
  height: number
}

type Item =
  | { kind: 'divider'; category: Category }
  | { kind: 'card'; category: Category; project: Project; tabX: number }

const DIVIDER = '#1c1f3a'
const DIVIDER_TAB = { w: 0.3, h: 0.08 }
/** 칸막이 인덱스 탭은 왼쪽 끝, 카드 탭은 세 자리를 돌아가며 써서 뒤쪽 탭도 보이게 한다 */
const DIVIDER_TAB_X = -0.3
const CARD_TAB_X = [0.27, 0, -0.27]
/** 맨 앞 칸막이와 서랍 앞판 사이 여백 */
const FRONT_GAP = 0.1
/** 카드·칸막이가 뒤로 기댄 각도(rad). 위에서 내려다볼 때 탭 글자가 잘 읽히게 */
export const LEAN = 0.35

/** 칸막이: 짙은 판 + 카테고리 색 인덱스 탭 */
function Divider({ category, z, width, height }: { category: Category; z: number; width: number; height: number }) {
  const tex = useMemo(() => tabTexture(category.label, category.color), [category])
  useEffect(() => () => tex.dispose(), [tex])
  return (
    <group position={[0, 0, z]} rotation-x={-LEAN}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, CARD_THICKNESS]} />
        <meshStandardMaterial color={DIVIDER} roughness={0.6} />
      </mesh>
      <mesh position={[DIVIDER_TAB_X, height + DIVIDER_TAB.h / 2, 0]} castShadow>
        <boxGeometry args={[DIVIDER_TAB.w, DIVIDER_TAB.h, CARD_THICKNESS]} />
        <meshStandardMaterial color={DIVIDER} roughness={0.6} />
      </mesh>
      <mesh position={[DIVIDER_TAB_X, height + DIVIDER_TAB.h / 2, CARD_THICKNESS / 2 + 0.0005]}>
        <planeGeometry args={[DIVIDER_TAB.w * 0.92, DIVIDER_TAB.h * 0.82]} />
        <meshStandardMaterial map={tex} roughness={0.5} />
      </mesh>
    </group>
  )
}

/**
 * 서랍 안 칸막이와 인덱스 카드. projects.ts의 순서대로 카테고리마다 칸막이 하나 + 카드들을
 * 앞에서부터 같은 간격으로 꽂는다. 프로젝트 수가 바뀌면 간격이 자동으로 다시 계산된다.
 */
export default function FileContents({ drawerIndex, width, depth, height }: Props) {
  const items = useMemo<Item[]>(
    () =>
      CATEGORIES.flatMap((category) => {
        const projects = PROJECTS.filter((p) => p.category === category.id)
        if (projects.length === 0) return []
        return [
          { kind: 'divider' as const, category },
          // 카테고리마다 오른쪽부터 다시 시작해, 칸막이 바로 뒤 카드 탭이 칸막이 탭(왼쪽)에 가리지 않게 한다
          ...projects.map((project, k) => ({
            kind: 'card' as const,
            category,
            project,
            tabX: CARD_TAB_X[k % CARD_TAB_X.length],
          })),
        ]
      }),
    [],
  )

  const sheetW = width - 0.06
  // 서랍이 닫혔을 때 탭이 앞판 위로 보이지 않는 높이
  const cardH = height - 0.09
  const dividerH = cardH + 0.03
  // 앞쪽은 앞판에 탭이 가리지 않게 여백을 두고, 뒤쪽은 기댄 윗부분이 뒷판을 넘지 않게 남긴 뒤 균등하게 나눈다
  const leanBack = (dividerH + DIVIDER_TAB.h) * Math.sin(LEAN)
  const usable = depth - FRONT_GAP - leanBack
  const pitch = usable / Math.max(1, items.length - 1)
  const zAt = (i: number) => depth / 2 - FRONT_GAP - pitch * i

  return (
    <group>
      {items.map((it, i) =>
        it.kind === 'divider' ? (
          <Divider key={`d-${it.category.id}`} category={it.category} z={zAt(i)} width={sheetW + 0.02} height={dividerH} />
        ) : (
          <ProjectCard
            key={it.project.id}
            project={it.project}
            color={it.category.color}
            z={zAt(i)}
            tabX={it.tabX}
            width={sheetW}
            height={cardH}
            drawerIndex={drawerIndex}
            lean={LEAN}
          />
        ),
      )}
    </group>
  )
}
