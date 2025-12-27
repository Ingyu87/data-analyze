import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 큰 라이브러리들을 별도 청크로 분리
          if (id.includes('node_modules')) {
            if (id.includes('plotly.js')) {
              return 'plotly';
            }
            if (id.includes('xlsx')) {
              return 'xlsx';
            }
            if (id.includes('pdfjs-dist')) {
              return 'pdfjs';
            }
            if (id.includes('html2canvas')) {
              return 'html2canvas';
            }
            if (id.includes('jspdf')) {
              return 'jspdf';
            }
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    open: true
  },
  define: {
    'global': 'globalThis',
  },
})


