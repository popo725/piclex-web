import '../../../packages/laboratory/src/game.css';
import {experienceReport} from '../../../packages/practice/src/experience-store.mjs';
const scope=window as any;scope.PICLEX_PUBLIC_WEB=true;
async function start(){scope.PICLEX_USER_LEVEL=await experienceReport().catch(()=>null);if(parent!==window){scope.PICLEX_LAB_WORDS=await new Promise(resolve=>{const timer=setTimeout(()=>{window.removeEventListener('message',receive);resolve([]);},5000);function receive(e:MessageEvent){if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='piclex-lab-words')return;clearTimeout(timer);window.removeEventListener('message',receive);resolve(e.data.words);}window.addEventListener('message',receive);parent.postMessage({type:'piclex-lab-ready'},location.origin);});}await import('../../../packages/laboratory/src/main.mjs');}
void start();
