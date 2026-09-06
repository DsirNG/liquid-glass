import { resolve } from 'node:path';
import { copyFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

const copyStyleDtsPlugin: Plugin = {
  name: 'copy-style-dts',
  closeBundle() {
    copyFileSync(
      resolve(__dirname, 'src/style.css.d.ts'),
      resolve(__dirname, 'dist/style.css.d.ts')
    );
  },
};

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
    copyStyleDtsPlugin,
  ],

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: {
        'core/index': resolve(__dirname, 'src/core/index.ts'),
        'vue/index': resolve(__dirname, 'src/vue/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue'],
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
