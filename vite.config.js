import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    sourcemap: false,
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/internal-render': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})