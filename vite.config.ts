import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

/** SPA fallback: serve index.html for routes so refresh on /dashboard, /employees, etc. works (dev + preview) */
function spaFallbackPlugin() {
  const fallbackMiddleware = (req: { url?: string; method?: string }, _res: unknown, next: () => void) => {
    if (req.method !== 'GET') return next()
    const pathname = req.url?.split('?')[0] ?? ''
    const isAsset = pathname.startsWith('/@') || pathname.startsWith('/node_modules') ||
      pathname.startsWith('/src') || pathname.startsWith('/assets') || pathname.includes('.') || pathname === '/vite.svg'
    if (pathname !== '/' && pathname !== '/index.html' && !isAsset) {
      req.url = '/index.html'
    }
    next()
  }
  return {
    name: 'spa-fallback',
    configureServer(server: { middlewares: { use: (fn: (req: any, res: any, next: () => void) => void) => void } }) {
      server.middlewares.use(fallbackMiddleware)
    },
    configurePreviewServer(server: { middlewares: { use: (fn: (req: any, res: any, next: () => void) => void) => void } }) {
      server.middlewares.use(fallbackMiddleware)
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    spaFallbackPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/',
  server: { strictPort: false },

  assetsInclude: ['**/*.svg', '**/*.csv'],
})
