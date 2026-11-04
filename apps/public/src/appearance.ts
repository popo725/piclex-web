import {useEffect} from 'react';
import presets from './native-themes.json';
import {readPreference,writePreference} from './storage';
export type Theme={id:string;name:string;light:string[];dark:string[];availability?:string|null};
export const themes:Theme[]=presets;
export const accents=[['theme','主题默认'],['monochrome','黑白'],['blue','蓝色'],['green','绿色'],['yellow','黄色'],['pink','粉色'],['orange','橙色'],['purple','紫色']];
type Configuration={light:string;dark:string;lightAccent:string;darkAccent:string;custom:Theme[]};
const defaults={light:'chatgpt',dark:'chatgpt',lightAccent:'monochrome',darkAccent:'monochrome',custom:[]};
export function readAppearance():Configuration{try{const data=JSON.parse(readPreference('piclex-web.appearance')||'{}');return {...defaults,...data,custom:Array.isArray(data.custom)?data.custom.filter((t:Theme)=>t&&typeof t.id==='string'&&typeof t.name==='string'&&[t.light,t.dark].every(c=>Array.isArray(c)&&c.length===3&&c.every(s=>/^#[0-9a-f]{6}$/i.test(s)))):[]};}catch{return {...defaults};}}
export function saveAppearance(value:Configuration){writePreference('piclex-web.appearance',JSON.stringify(value));window.dispatchEvent(new Event('piclex-appearance'));}
export function selectedTheme(c:Configuration,dark:boolean){return [...themes,...c.custom].find(t=>t.id===c[dark?'dark':'light']&&t.availability!==(dark?'light':'dark'))||themes[0];}
const rgb=(s:string)=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255);
const hex=(c:number[])=>'#'+c.map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');
const mix=(a:string,b:string,t:number)=>hex(rgb(a).map((v,i)=>v+(rgb(b)[i]-v)*t));
const lum=(s:string)=>rgb(s).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
export const contrast=(a:string,b:string)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
function readable(c:string,backgrounds:string[],ink:string){for(let i=0;i<=100;i++){const candidate=mix(c,ink,i/100);if(backgrounds.every(bg=>contrast(candidate,bg)>=4.5))return candidate;}return ink;}
export function readableTheme(t:Theme){return [t.light,t.dark].every(([bg,fg])=>[bg,mix(bg,fg,.045),mix(bg,fg,.08)].every(c=>contrast(c,fg)>=4.5));}
export function useAppearancePalette(dark:boolean){useEffect(()=>{const apply=()=>{
 const c=readAppearance(),theme=selectedTheme(c,dark),[bg,originalInk,baseAccent]=theme[dark?'dark':'light'];
 const exact=dark&&themes.some(t=>t.id===theme.id),ink=exact?originalInk:readable(originalInk,[bg,mix(bg,originalInk,.045),mix(bg,originalInk,.08)],contrast(bg,'#000000')>contrast(bg,'#ffffff')?'#000000':'#ffffff');
 const surface=mix(bg,ink,.045),elevated=mix(bg,ink,.08),backgrounds=[bg,surface,elevated];
 const choices:Record<string,string>={theme:baseAccent,monochrome:ink,blue:'#3566f0',green:'#04bb9f',yellow:'#ffcc38',pink:'#fa70ab',orange:'#ff8066',purple:'#a25bff'};
 const color=choices[c[dark?'darkAccent':'lightAccent']]||ink,accent=exact?color:readable(color,backgrounds,ink);
 const values:Record<string,string>={bg,surface,elevated,ink,line:mix(bg,ink,.18),muted:readable(mix(bg,ink,.58),backgrounds,ink),button:accent,'button-text':contrast(accent,'#000000')>contrast(accent,'#ffffff')?'#000000':'#ffffff',ripple:accent};
 const root=document.documentElement;Object.entries(values).forEach(([key,value])=>root.style.setProperty('--'+key,value));root.style.backgroundColor=bg;root.style.color=ink;root.dataset.palette=theme.id;
 };apply();window.addEventListener('piclex-appearance',apply);window.addEventListener('storage',apply);return()=>{window.removeEventListener('piclex-appearance',apply);window.removeEventListener('storage',apply);};},[dark]);}
