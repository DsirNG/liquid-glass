import { resolve } from 'node:path';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

const injectVueStylesPlugin: Plugin = {
  name: 'inject-vue-styles',
  closeBundle() {
    const stylePath = resolve(__dirname, 'dist/style.css');
    const vuePath = resolve(__dirname, 'dist/vue/index.js');
    if (!existsSync(stylePath) || !existsSync(vuePath)) return;

    const css = readFileSync(stylePath, 'utf8').replace(/\\/g, '\\\\').replace(/`/g, '\\`');
    const injection = `(function(){if(typeof document==='undefined')return;var id='dinqorai-liquid-glass-styles';if(document.getElementById(id))return;var s=document.createElement('style');s.id=id;s.textContent=\`${css}\`;document.head.appendChild(s)})();\n`;
    const vueCode = readFileSync(vuePath, 'utf8');
    if (!vueCode.includes('dinqorai-liquid-glass-styles'))
      writeFileSync(vuePath, injection + vueCode);
  },
};

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
    injectVueStylesPlugin,
    dts({
      tsconfigPath: resolve(__dirname, 'tsconfig.app.json'),
      include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue'],
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
        'react/index': resolve(__dirname, 'src/react/index.tsx'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'vue'],
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
