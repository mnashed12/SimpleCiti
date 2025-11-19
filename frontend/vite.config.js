import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../staticfiles/react',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: './src/main.jsx',
    },
  },
  server: {
    port: 5173,
    strictPort: true, // fail if 5173 is taken so Django template stays accurate
    host: 'localhost',
    hmr: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/SE': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/user': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/accounts': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/static': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
