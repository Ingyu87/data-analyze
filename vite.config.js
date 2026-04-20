import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('plotly.js')) {
                return 'plotly'
              }
              if (id.includes('xlsx')) {
                return 'xlsx'
              }
              if (id.includes('pdfjs-dist')) {
                return 'pdfjs'
              }
              if (id.includes('html2canvas')) {
                return 'html2canvas'
              }
              if (id.includes('jspdf')) {
                return 'jspdf'
              }
              return 'vendor'
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    server: {
      port: 3000,
      open: true,
      ...(apiProxyTarget
        ? {
            proxy: {
              '/api': {
                target: apiProxyTarget,
                changeOrigin: true,
              },
            },
          }
        : {}),
    },
    define: {
      global: 'globalThis',
    },
  }
})
