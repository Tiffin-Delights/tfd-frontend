import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "")
  const backendTarget = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8000"

  return {
    plugins: [react()],
    server: {
      middlewareMode: false,
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true
        },
        "/uploads": {
          target: backendTarget,
          changeOrigin: true
        }
      },
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
      }
    },
    preview: {
      headers: {
        'Cache-Control': 'public, max-age=3600'
      }
    }
  }
})
