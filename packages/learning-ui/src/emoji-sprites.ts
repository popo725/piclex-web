import {symbols} from './experience-flight.mjs';
export type EmojiSprite={image:HTMLCanvasElement;x:number;y:number;cell:number;ratio:number};
let sprites:(EmojiSprite|undefined)[]=[],atlas:HTMLCanvasElement|null=null,context:CanvasRenderingContext2D|null=null;
type WarmTask={idle:number|null;timer:number|null};
let density=0,next=0,pending:WarmTask|null=null;
export function stopEmojiPreparation(){
 if(pending?.idle!=null)window.cancelIdleCallback(pending.idle);
 if(pending?.timer!=null)clearTimeout(pending.timer);
 pending=null;
}
export function emojiSprite(index:number){return sprites[index];}
/** Native Emoji at the largest existing font size; smaller particles keep their exact scale. */
export function prepareEmojiSprites(){
 if(document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 // Oversample the atlas so rotation and fractional particle sizes stay crisp.
 const ratio=Math.min(2,devicePixelRatio||1)*2;
 if(ratio!==density){stopEmojiPreparation();density=ratio;sprites=[];atlas=null;context=null;next=0;}
 if(pending!==null||next===symbols.length)return;
 const task:WarmTask={idle:null,timer:null};pending=task;
 const warm=()=>{
  if(pending!==task)return;stopEmojiPreparation();if(document.hidden)return;
  const cell=Math.ceil(32*density);
  if(!atlas){
   atlas=document.createElement('canvas');atlas.width=cell*4;atlas.height=cell*4;
   context=atlas.getContext('2d');if(!context){atlas=null;return;}
   context.setTransform(density,0,0,density,0,0);context.font='14px system-ui';context.textAlign='center';context.textBaseline='middle';
  }
  const x=next%4*cell,y=Math.floor(next/4)*cell;
  context!.fillText(symbols[next],(x+cell/2)/density,(y+cell/2)/density);
  sprites[next]={image:atlas,x,y,cell,ratio:density};next++;
  // One glyph per idle task. Input never waits for the atlas: an unprepared
  // particle uses the original full-quality text renderer until it is ready.
  prepareEmojiSprites();
 };
 // WebKit can defer idle callbacks even on an otherwise quiet page. A
 // bounded timer races the idle task; only the winner renders this glyph.
 if(typeof window.requestIdleCallback==='function')task.idle=window.requestIdleCallback(warm,{timeout:50});
 task.timer=window.setTimeout(warm,50);
}
