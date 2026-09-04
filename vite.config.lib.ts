import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

export default defineConfig({
  publicDir: false,
  plugins: [
    vue(),
    dts({
      tsconfigPath: resolve(__dirname, 'tsconfig.app.json'),
      include: ['src/**/*.ts', 'src/**/*.vue'],
      entryRoot: 'src',
      outDir: 'dist',
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: {
        'core/index': resolve(__dirname, 'src/core/index.ts'),
        'vue/index': resolve(__dirname, 'src/vue/index.ts'),
        'webgl/index': resolve(__dirname, 'src/webgl/index.ts'),
        'vue-webgl/index': resolve(__dirname, 'src/vue-webgl/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', 'three'],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'style.css';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
