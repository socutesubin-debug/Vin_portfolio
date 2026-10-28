import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/bodoni-moda/400.css'
import './styles/tokens.css'
import V2App from './v2/V2App'

// V1(서랍장 사이트)은 src/app/App.tsx에 그대로 있고 main 브랜치에서 배포된다.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <V2App />
  </StrictMode>,
)
