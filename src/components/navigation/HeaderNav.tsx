import { NAV_ITEMS, sectionOf, type NavSection } from '../../animations/stages'
import { scrollToSection, scrollToTop } from '../../animations/masterTimeline'
import { useExperience } from '../../state/experienceStore'

/** 상단 고정 내비게이션. 열린 Focus를 먼저 닫은 뒤 해당 스크롤 구간으로 이동한다. */
export default function HeaderNav({ onNavigate }: { onNavigate?: (s: NavSection | 'top') => void }) {
  const stage = useExperience((s) => s.stage)
  const reduced = useExperience((s) => s.reducedMotion)
  const current = sectionOf(stage)

  const go = (target: NavSection | 'top') => {
    if (onNavigate) return onNavigate(target)
    const s = useExperience.getState()
    if (s.focus.type !== 'none') s.closeFocus()
    // 스크롤 잠금이 풀린 다음 프레임에 이동
    requestAnimationFrame(() => (target === 'top' ? scrollToTop(!reduced) : scrollToSection(target, !reduced)))
  }

  return (
    <header className="site-header">
      <button type="button" className="site-logo" onClick={() => go('top')} aria-label="VIN, 처음으로">
        VIN
      </button>
      <nav aria-label="주요 섹션">
        <ul className="site-nav">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="site-nav__link"
                aria-current={current === item.id ? 'true' : undefined}
                onClick={() => go(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
