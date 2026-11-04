import { isWork, useHome } from '../state/homeStore'

const MENU = ['HOME', 'ABOUT', 'WORK', 'CONTACT'] as const

/**
 * 화면에 고정된 UI(3D 카메라와 무관): 왼쪽 위 로고, 오른쪽 위 메뉴, 왼쪽 아래 사운드, 오른쪽 아래 ©.
 * 메뉴: ABOUT은 노트북 접근, WORK는 서랍장으로 내려가기, HOME은 대표 구도로. CONTACT는 후속 단계라 아직 비활성.
 */
export default function HomeChrome() {
  const mode = useHome((s) => s.mode)
  const soundOn = useHome((s) => s.soundOn)
  const { openAbout, openWork, goHome, setSoundOn } = useHome.getState()
  const current = mode === 'ABOUT_OPEN' || mode === 'CAMERA_TRANSITION' ? 'ABOUT' : isWork(mode) ? 'WORK' : 'HOME'

  const go = (item: (typeof MENU)[number]) => {
    if (item === 'ABOUT') openAbout()
    if (item === 'WORK') openWork()
    if (item === 'HOME') goHome()
  }

  return (
    <>
      <a className="v4-logo" href="/" aria-label="Vision Inside — 처음으로">
        Vision Inside
      </a>
      <nav className="v4-menu" aria-label="메뉴">
        <ul>
          {MENU.map((item) => {
            const later = item === 'CONTACT'
            return (
              <li key={item}>
                <button
                  type="button"
                  className="v4-menu__link"
                  aria-current={current === item ? 'page' : undefined}
                  aria-disabled={later || undefined}
                  title={later ? '다음 단계에서 열려요' : undefined}
                  onClick={() => !later && go(item)}
                >
                  {item}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
      {/* 소리는 기본 꺼짐. 이번 단계에는 재생할 소리가 없고 자동 재생도 하지 않는다 */}
      <button
        type="button"
        className="v4-sound"
        aria-pressed={soundOn}
        aria-label={soundOn ? '사운드 끄기' : '사운드 켜기'}
        onClick={() => setSoundOn(!soundOn)}
      >
        <span className="v4-sound__bars" data-on={soundOn} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
      </button>
      <p className="v4-copy">©2026</p>
    </>
  )
}
