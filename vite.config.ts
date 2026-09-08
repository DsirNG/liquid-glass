import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Expose the playground to the local network during development.
  server: {
    host: true,
  },
  build: {
    outDir: 'dist-playground',
    emptyOutDir: true,
  },
})
