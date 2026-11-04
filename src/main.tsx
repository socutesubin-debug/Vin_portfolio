import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/jost/400.css'
import '@fontsource/jost/500.css'
import '@fontsource/jost/600.css'
import '@fontsource/yellowtail/400.css'
import '@fontsource/noto-sans-kr/400.css'
import '@fontsource/noto-sans-kr/500.css'
import V6App from './v6/V6App'
import { applyThemeVars } from './v6/theme'

// V1은 main, V2~V5는 각 브랜치(src/v2~v5). V6(v6-desk)는 듀오톤 책상 한 장면(src/v6/, docs/refs/home/)
applyThemeVars() // 첫 그림 전에 theme.ts 색을 CSS 변수로
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <V6App />
  </StrictMode>,
)
