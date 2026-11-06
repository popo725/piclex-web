import type {Page} from '@playwright/test';
/** Observe the actual signal gain, including platforms where media.volume is ignored. */
export async function observeAmbienceMix(page:Page,lockedVolume=false){
 await page.addInitScript(({lockedVolume})=>{
  const w=window as any,Original=window.AudioContext;w.__ambienceMixes=[];
  w.AudioContext=class extends Original{
   createMediaElementSource(sound:HTMLMediaElement){
    const source=super.createMediaElementSource(sound),connect=source.connect.bind(source);
    (source as any).connect=(node:AudioNode,...args:any[])=>{if(sound.src.includes('/ambience/'))w.__ambienceMixes.push({sound,node,context:this});return (connect as any)(node,...args);};return source;
   }
  };
  if(lockedVolume){const volume=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'volume')!;Object.defineProperty(HTMLMediaElement.prototype,'volume',{...volume,get(){return this.src.includes('/ambience/')?1:volume.get!.call(this);},set(value){if(!this.src.includes('/ambience/'))volume.set!.call(this,value);}});}
 },{lockedVolume});
}
export async function ambienceGain(page:Page){return page.evaluate(()=>(window as any).__ambienceMixes.at(-1)?.node.gain.value??-1);}
