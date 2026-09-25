import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: '@dinqorai/liquid-glass/style.css',
        replacement: fileURLToPath(new URL('./src/styles/liquid-glass.css', import.meta.url)),
      },
      {
        find: '@dinqorai/liquid-glass/vue',
        replacement: fileURLToPath(new URL('./src/vue/index.ts', import.meta.url)),
      },
      {
        find: '@dinqorai/liquid-glass',
        replacement: fileURLToPath(new URL('./src/core/index.ts', import.meta.url)),
      },
    ],
  },
  // Expose the playground to the local network during development.
  server: {
    host: true,
  },
  build: {
    outDir: 'dist-playground',
    emptyOutDir: true,
  },
});
