import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({ root: 'apps/public', base: '/piclex-web/', build: { outDir: '../../dist', emptyOutDir: true, target: 'es2022', rollupOptions: { input: { main: fileURLToPath(new URL('apps/public/index.html', import.meta.url)), lab: fileURLToPath(new URL('apps/public/lab/index.html', import.meta.url)) } } }, server: { fs: { allow: [fileURLToPath(new URL('.', import.meta.url))] } } });
