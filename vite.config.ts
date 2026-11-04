import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
// Emit the exact built module sizes so cold-start progress measures downloaded
// bytes. Hashed URLs share the browser cache with the subsequent module import.
function gameBootManifest(){return {name:'game-boot-manifest',enforce:'post' as const,generateBundle(_options:any,bundle:any){
 const entry=Object.values(bundle).find((item:any)=>item.type==='chunk'&&item.facadeModuleId?.endsWith('/packages/laboratory/src/main.mjs')) as any;
 const html=bundle['lab/index.html'];if(!entry||!html)throw Error('Missing game boot entry');
 const assets=new Map<string,number>();
 const collect=(chunk:any)=>{if(assets.has(chunk.fileName))return;assets.set(chunk.fileName,Buffer.byteLength(chunk.code));for(const name of chunk.imports){const child=bundle[name];if(child?.type==='chunk')collect(child);}};collect(entry);
 const manifest=[...assets].map(([name,bytes])=>({url:'/piclex-web/'+name,bytes}));
 html.source=String(html.source).replace('</head>',`<script>window.PICLEX_LAB_BOOT_ASSETS=${JSON.stringify(manifest)}</script></head>`);
}};}
export default defineConfig({ plugins:[gameBootManifest()], root: 'apps/public', base: '/piclex-web/', build: { outDir: '../../dist', emptyOutDir: true, target: 'es2022', rollupOptions: { input: { subscribe: fileURLToPath(new URL('apps/public/subscribe/index.html', import.meta.url)), main: fileURLToPath(new URL('apps/public/index.html', import.meta.url)), lab: fileURLToPath(new URL('apps/public/lab/index.html', import.meta.url)) } } }, server: { fs: { allow: [fileURLToPath(new URL('.', import.meta.url))] } } });
