import {createHash} from 'node:crypto';
import {cp,mkdir,readFile,readdir,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const sha=data=>createHash('sha256').update(data).digest('hex');
export async function prepareVerifiedImage(input,output,revision,repository=resolve('.')){
 const manifest=JSON.parse(await readFile(join(input,'release.json'),'utf8'));
 if(!/^[a-f0-9]{40}$/.test(revision)||manifest.sourceRevision!==revision)throw Error('Artifact source revision mismatch');
 if(manifest.releaseID!==revision.slice(0,12)+'-'+sha(JSON.stringify(manifest.files)).slice(0,12))throw Error('Artifact identity mismatch');
 const expected=new Set(['release.json']);
 for(const [name,info] of Object.entries(manifest.files)){
  if(!/^piclex-web\/[A-Za-z0-9_./-]+$/.test(name)||name.split('/').some(x=>!x||x==='..'||x.startsWith('.')))throw Error('Unsafe artifact path');
  const relative=name.slice('piclex-web/'.length);expected.add(relative);
  const bytes=await readFile(join(input,relative));
  if(bytes.length!==info.bytes||sha(bytes)!==info.sha256)throw Error('Artifact checksum mismatch: '+relative);
 }
 async function check(dir,prefix=''){
  for(const entry of await readdir(dir,{withFileTypes:true})){
   const name=prefix+entry.name;
   if(entry.isDirectory())await check(join(dir,entry.name),name+'/');
   else if(!entry.isFile()||!expected.delete(name))throw Error('Unexpected artifact file: '+name);
  }
 }
 await check(input);if(expected.size)throw Error('Missing artifact files');
 await mkdir(output); // Refuse to overwrite another task's context.
 await cp(input,join(output,'dist'),{recursive:true});
 for(const [source,dest] of [['docker/Dockerfile.verified','Dockerfile'],['docker/nginx.conf','nginx.conf'],['LICENSE','LICENSE'],['ASSET_LICENSES.md','ASSET_LICENSES.md']])await copyFile(join(repository,source),join(output,dest));
 console.log(`Verified ${Object.keys(manifest.files).length} files for ${revision}; image reuses exact Pages bytes`);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await prepareVerifiedImage(...process.argv.slice(2));
