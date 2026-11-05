import process from 'node:process'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { mockApiPlugin } from './dev/mockApiPlugin.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const liveApiMode = mode === 'api'
  const enableMock = !liveApiMode && env.VITE_ENABLE_MOCK === 'true'
  const hasApiUrl = Boolean(env.VITE_API_URL && env.VITE_API_URL.trim() !== '')

  if (enableMock && hasApiUrl) {
    throw new Error(
      'VITE_ENABLE_MOCK=true and VITE_API_URL cannot both be set. ' +
        'Remove VITE_API_URL to use the local dev mock, or set VITE_ENABLE_MOCK=false to target the backend.',
    )
  }

  return {
    define: liveApiMode ? {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:8080'),
      'import.meta.env.VITE_ENABLE_MOCK': JSON.stringify('false'),
    } : {},
    plugins: [react(), ...(enableMock ? [mockApiPlugin()] : [])],
    server: {
      watch: {
        ignored: ['**/.vs/**'],
      },
    },
  }
})
