import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/bodoni-moda/400.css'
import './styles/tokens.css'
import V3App from './v3/V3App'

// V1(서랍장 사이트)은 src/app/App.tsx(main 브랜치), V2 작업실은 src/v2/. V3는 INTRO 영상 + V2 작업실 재사용(src/v3/)
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <V3App />
  </StrictMode>,
)
