import { useEffect, useRef, useState } from 'react'
import { focusArrival, rememberOpener } from '../focus'
import { navigate, type Route } from '../router'
import { Panel } from './Panel'
import { CoverLetter } from './CoverLetter'
import { Resume } from './Resume'

type HomeMode = 'composite' | 'layout' | 'plan'

const MODES: { id: HomeMode; label: string }[] = [
  { id: 'composite', label: 'Home 시안' },
  { id: 'layout', label: '3D 배치' },
  { id: 'plan', label: '평면도' },
]

/**
 * Home · 책상 (자리표시)
 * V6 배경(v5-home-desk-background-v6.png)·iMac/table OBJ·평면도 SVG가 들어오면 home/HomeScene.ts를 채워
 * 이 자리의 .v5-home-stage에 붙인다. 지금은 같은 동선(자기소개서·이력서 패널, 보기 전환)만 동작한다.
 */
export function HomeView({ route }: { route: Route }) {
  const [mode, setMode] = useState<HomeMode>('composite')
  const panel = route.name === 'about' || route.name === 'resume' ? route.name : null

  // 패널이 닫혀 책상으로 돌아오면 열었던 버튼으로 포커스를 돌려준다
  const prevPanel = useRef(panel)
  useEffect(() => {
    if (prevPanel.current && !panel) focusArrival(document.querySelector('.v5-home') ?? document, true)
    prevPanel.current = panel
  }, [panel])

  const open = (href: string) => (e: React.MouseEvent<HTMLElement>) => {
    rememberOpener(e.currentTarget)
    navigate(href)
  }
  const close = () => navigate('#home')

  return (
    <section className="v5-screen v5-home" aria-labelledby="home-title">
      <div className="v5-home-stage" data-mode={mode} aria-hidden="true">
        <div className="v5-home-placeholder">
          <span className="v5-home-desk" />
          <span className="v5-home-cabinet" />
        </div>
      </div>

      <div className="v5-home-copy">
        <p className="v5-eyebrow">Home · 책상</p>
        <h1 id="home-title" tabIndex={-1} data-screen-title>
          책상 위에서 저를 소개할게요
        </h1>
        <p className="v5-note" role="note">
          책상 장면은 준비 중이에요. V6 배경 이미지와 iMac 모델이 들어오면 이 자리에 3D 장면이 붙습니다.
        </p>
        <div className="v5-home-actions">
          <button type="button" className="v5-btn v5-btn-primary" onClick={open('#resume')}>
            이력서 보기 <span className="v5-sub">iMac</span>
          </button>
          <button type="button" className="v5-btn" onClick={open('#about')}>
            자기소개서 보기 <span className="v5-sub">서류더미</span>
          </button>
        </div>
        <ul className="v5-quicklinks" aria-label="바로가기">
          <li>
            <a href="#projects">프로젝트 목록 바로 보기 →</a>
          </li>
          <li>
            <a href="#message">메시지 바로 남기기 →</a>
          </li>
        </ul>
      </div>

      <div className="v5-home-modes" role="group" aria-label="Home 보기">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={mode === m.id}
            onClick={() => setMode(m.id)}
            disabled={m.id !== 'composite'}
            title={m.id !== 'composite' ? 'output/home-prototype 자료가 들어오면 열립니다' : undefined}
          >
            {m.label}
          </button>
        ))}
      </div>

      {panel === 'about' && (
        <Panel eyebrow="ABOUT" title="자기소개서" onClose={close}>
          <CoverLetter />
        </Panel>
      )}
      {panel === 'resume' && (
        <Panel eyebrow="RESUME" title="이력서" onClose={close}>
          <Resume />
        </Panel>
      )}
    </section>
  )
}
