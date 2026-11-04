import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import V5App from './v5/V5App'

// V1(서랍장 사이트)은 main 브랜치, V2 작업실은 src/v2/, V3 INTRO는 src/v3/, V4 3D 작업실은 src/v4/.
// V5는 Home 책상 → Work 수납장 → Projects → Contact 전화기 흐름(src/v5/, docs/v5-plan.md)
const root = document.getElementById('root')!
const dev = new URLSearchParams(location.search).get('dev')

if (import.meta.env.DEV && dev === 'drawers') {
  import('./v5/dev/drawerCheck').then((m) => m.mountDrawerCheck(root))
} else if (import.meta.env.DEV && dev === 'models') {
  import('./v5/dev/modelCheck').then((m) => m.mountModelCheck(root))
} else {
  createRoot(root).render(
    <StrictMode>
      <V5App />
    </StrictMode>,
  )
}
