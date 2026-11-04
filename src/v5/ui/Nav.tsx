import { rememberOpener } from '../focus'
import { useSoundOn, setSoundOn } from '../prefs'
import { sceneOf, type Route } from '../router'

const ITEMS = [
  { label: 'HOME', href: '#home', match: (r: Route) => r.name === 'home' || r.name === 'resume' },
  { label: 'ABOUT', href: '#about', match: (r: Route) => r.name === 'about' },
  { label: 'WORK', href: '#work', match: (r: Route) => sceneOf(r) === 'work' || sceneOf(r) === 'projects' },
  { label: 'CONTACT', href: '#contact', match: (r: Route) => sceneOf(r) === 'contact' },
]

export function Nav({ route }: { route: Route }) {
  const sound = useSoundOn()
  return (
    <header className="v5-nav" data-tone={sceneOf(route) === 'home' ? 'dark' : 'light'}>
      <a className="v5-logo" href="#home">
        Vision INside
      </a>
      <nav aria-label="주요 메뉴">
        <ul>
          {ITEMS.map((it) => (
            <li key={it.href}>
              <a
                href={it.href}
                aria-current={it.match(route) ? 'page' : undefined}
                onClick={(e) => rememberOpener(e.currentTarget)}
              >
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <button
        type="button"
        className="v5-sound"
        aria-pressed={sound}
        onClick={() => setSoundOn(!sound)}
      >
        <span aria-hidden="true" className="v5-sound-bars" data-on={sound} />
        <span className="v5-sr">{sound ? '소리 끄기' : '소리 켜기'}</span>
        <span className="v5-sound-label" aria-hidden="true">
          {sound ? 'SOUND ON' : 'SOUND OFF'}
        </span>
      </button>
    </header>
  )
}
