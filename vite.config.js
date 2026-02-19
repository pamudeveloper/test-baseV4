import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/lark': {
        target: 'https://open.larksuite.com/open-apis',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lark/, ''),
      },
    },
  },
})
