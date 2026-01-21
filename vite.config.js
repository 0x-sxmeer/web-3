import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy for LI.FI (Jumper's Engine)
      '/api/lifi': {
        target: 'https://li.quest/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lifi/, ''),
        headers: {
          // Your specific API Key
          'x-lifi-api-key': '36490c42-e387-4912-9fba-9ee2eec448f6.f2a1815d-8e9e-4988-a212-1abf9e40c025'
        }
      }
    }
  }
})
