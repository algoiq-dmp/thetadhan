import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Local dev only. In production, API calls go directly to the Worker URL.
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        ws: true,
      }
    }
  }
})
