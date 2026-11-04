import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/bodoni-moda/400.css'
import './styles/tokens.css'
import V4App from './v4/V4App'

// V1(서랍장 사이트)은 main 브랜치, V2 작업실은 src/v2/, V3 INTRO는 src/v3/. V4는 HOME을 3D 인터랙티브 작업실로(src/v4/)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <V4App />
  </StrictMode>,
)
