import {useEffect,useState,useCallback,type CSSProperties} from 'react';
type RGB=[number,number,number];
type Sample={color:RGB;weight:number};
const distance=(a:RGB,b:RGB)=>a.reduce((sum,v,i)=>sum+(v-b[i])**2,0);
const luminance=(a:RGB)=>a.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const contrast=(a:RGB,b:RGB)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
const mix=(a:RGB,b:RGB,t:number)=>a.map((v,i)=>v+(b[i]-v)*t) as RGB;
const css=(a:RGB)=>`rgb(${a.map(v=>Math.round(v*255)).join(' ')})`;
// Port of App PhotoCardPalette: 64px sample, 5-bit histogram, weighted k-means,
// up to five colors, twelve iterations, 4.6:1 minimum text contrast.
function extract(image:HTMLImageElement){
 const canvas=document.createElement('canvas'),scale=Math.min(1,64/Math.max(image.naturalWidth,image.naturalHeight));
 canvas.width=Math.max(1,Math.floor(image.naturalWidth*scale));canvas.height=Math.max(1,Math.floor(image.naturalHeight*scale));
 const context=canvas.getContext('2d',{willReadFrequently:true})!;context.drawImage(image,0,0,canvas.width,canvas.height);
 const pixels=context.getImageData(0,0,canvas.width,canvas.height).data,bins=new Map<number,{sum:RGB;weight:number}>();
 for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<128)continue;
  const c=[pixels[i]/255,pixels[i+1]/255,pixels[i+2]/255] as RGB,k=(pixels[i]>>3)<<10|(pixels[i+1]>>3)<<5|(pixels[i+2]>>3);
  const bin=bins.get(k)||{sum:[0,0,0] as RGB,weight:0};bin.weight++;bin.sum=bin.sum.map((v,n)=>v+c[n]) as RGB;bins.set(k,bin);
 }
 const samples:Sample[]=[...bins].sort((a,b)=>a[0]-b[0]).map(([,b])=>({color:b.sum.map(v=>v/b.weight) as RGB,weight:b.weight}));
 if(!samples.length)return {};
 const max=(score:(s:Sample)=>number)=>samples.reduce((a,b)=>score(b)>score(a)?b:a);
 let centers=[max(s=>s.weight).color];
 while(centers.length<Math.min(5,samples.length)){const next=max(s=>Math.min(...centers.map(c=>distance(s.color,c)))*Math.sqrt(s.weight));if(Math.min(...centers.map(c=>distance(next.color,c)))<=.0025)break;centers.push(next.color);}
 let clusters:{sum:RGB;weight:number}[]=[];
 for(let step=0;step<12;step++){
  clusters=centers.map(()=>({sum:[0,0,0],weight:0}));
  for(const sample of samples){let nearest=0;centers.forEach((c,i)=>{if(distance(sample.color,c)<distance(sample.color,centers[nearest]))nearest=i;});const c=clusters[nearest];c.weight+=sample.weight;c.sum=c.sum.map((v,i)=>v+sample.color[i]*sample.weight) as RGB;}
  const updated=clusters.map((c,i)=>c.weight?c.sum.map(v=>v/c.weight) as RGB:centers[i]),movement=Math.max(...updated.map((c,i)=>distance(c,centers[i])));centers=updated;if(movement<.000001)break;
 }
 const colors=clusters.filter(c=>c.weight).map(c=>({color:c.sum.map(v=>v/c.weight) as RGB,weight:c.weight})).sort((a,b)=>b.weight-a.weight||a.color[0]-b.color[0]||a.color[1]-b.color[1]||a.color[2]-b.color[2]);
 const background=colors[0].color,total=samples.reduce((n,c)=>n+c.weight,0),candidates=colors.slice(1).filter(c=>c.weight/total>=.02);
 let text=candidates.find(c=>contrast(c.color,background)>=4.6)?.color||[...candidates].sort((a,b)=>contrast(b.color,background)-contrast(a.color,background))[0]?.color||background;
 if(contrast(text,background)<4.6){const white:RGB=[1,1,1],black:RGB=[0,0,0],end=contrast(white,background)>contrast(black,background)?white:black;let low=0,high=1;for(let i=0;i<18;i++){const mid=(low+high)/2;if(contrast(mix(text,end,mid),background)>=4.6)high=mid;else low=mid;}text=mix(text,end,high);}
 return {'--photo-background':css(background),'--photo-ink':css(text)} as CSSProperties;
}
const cache=new Map<string,CSSProperties>();
export function usePhotoPalette(src?:string){
 const [palette,setPalette]=useState<CSSProperties>({});
 const read=useCallback((image:HTMLImageElement)=>{try{setPalette(extract(image));}catch{}},[]);
 useEffect(()=>{if(!src)return;const cached=cache.get(src);if(cached){setPalette(cached);return;}
  let cancelled=false;const image=new Image();image.crossOrigin='anonymous';image.onload=()=>{if(cancelled)return;try{const value=extract(image);if(cache.size>=32)cache.delete(cache.keys().next().value!);cache.set(src,value);setPalette(value);}catch{/* Keep the previous photo palette, matching App's fallback behavior. */}};image.src=src;
  return()=>{cancelled=true;image.onload=null;};
 },[src]);return {style:palette,read};
}
