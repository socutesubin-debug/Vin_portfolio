import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // three.js가 포함된 3D 청크(지연 로드)는 원래 크다. 초기 청크와 분리되어 있음을 확인했다.
    chunkSizeWarningLimit: 1200,
  },
})
