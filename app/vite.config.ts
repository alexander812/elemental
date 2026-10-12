import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

const rootPackage = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf-8')
) as { version: string }

// https://vite.dev/config/
export default defineConfig({
  base: process.env.DEPLOY_BASE ?? '/',
  define: {
    __APP_VERSION__: JSON.stringify(rootPackage.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
