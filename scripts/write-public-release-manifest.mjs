import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';

const root=resolve('dist');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const files={};
async function collect(directory,prefix='piclex-web/'){
  for(const entry of (await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
    if(entry.name==='release.json')throw Error('Public release manifest already exists; rebuild first');
    const name=prefix+entry.name,path=join(directory,entry.name);
    if(entry.isDirectory())await collect(path,name+'/');
    else if(entry.isFile()){const bytes=await readFile(path);files[name]={bytes:bytes.length,sha256:sha(bytes)};}
    else throw Error('Public release may contain only regular files');
  }
}
await collect(root);
const sourceRevision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(!/^[0-9a-f]{40}$/.test(sourceRevision))throw Error('Missing source revision');
const releaseID=`${sourceRevision.slice(0,12)}-${sha(JSON.stringify(files)).slice(0,12)}`;
await writeFile(join(root,'release.json'),JSON.stringify({releaseID,sourceRevision,origin:'https://piclex.v2fy.com',files},null,2)+'\n');
console.log(`Public release manifest: ${releaseID} (${Object.keys(files).length} files)`);
