import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// No package aliases: smoke test the actual distribution, not library source.
export default defineConfig({
  plugins: [vue()],
  root: fileURLToPath(new URL('./tests/consumer', import.meta.url)),
  publicDir: false,
  server: { host: '127.0.0.1', port: 5174 },
  build: { outDir: 'artifacts/dist', emptyOutDir: true },
});
