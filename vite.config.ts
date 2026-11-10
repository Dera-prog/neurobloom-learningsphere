import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Headless-browser profiles and screenshots live in the repo; watching them
    // can throw EBUSY on Windows and crash the dev server.
    watch: {
      ignored: ['**/.edge-*/**', '**/.shots/**', '**/dist/**'],
    },
  },
})
