import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({ root: 'apps/public', base: '/piclex-web/', build: { outDir: '../../dist', emptyOutDir: true, target: 'es2022' }, server: { fs: { allow: [fileURLToPath(new URL('.', import.meta.url))] } } });
