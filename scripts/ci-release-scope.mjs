import {execFileSync} from 'node:child_process';
import {readFileSync,appendFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export function changesProduct(paths){
  const tooling=new Set(['docker/Dockerfile.verified','scripts/prepare-verified-image.mjs','scripts/ci-release-scope.mjs']);
  return paths.some(path=>!tooling.has(path)&&! /^(\.github|docs|memory|tests)\//.test(path));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const event=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
 let publish=process.env.GITHUB_EVENT_NAME!=='pull_request';
 if(process.env.GITHUB_EVENT_NAME==='push'&&/^[a-f0-9]{40}$/.test(event.before)&&!/^0+$/.test(event.before)){
  const paths=execFileSync('git',['diff','--name-only','-z',event.before,process.env.GITHUB_SHA],{encoding:'utf8'}).split('\0').filter(Boolean);
  publish=changesProduct(paths);
 }
 appendFileSync(process.env.GITHUB_OUTPUT,`publish=${publish}\n`);
 console.log(publish?'Product change: publish after checks':'Tooling-only: run all checks without redeploying');
}
