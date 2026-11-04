import {readPreference} from './storage';
export const shutterSounds=[{id:'minolta',label:'Minolta 胶片相机',file:'minolta-shutter.wav'},{id:'kodak',label:'Kodak 折叠相机',file:'kodak-shutter.wav'},{id:'brownie-hawkeye',label:'Brownie Hawkeye',file:'brownie-shutter.wav'}];
let player:HTMLAudioElement|undefined,selected='',generation=0;
export function currentShutterSound(){const id=readPreference('camera.shutterSoundID');return shutterSounds.find(s=>s.id===id)||shutterSounds[0];}
export function stopShutterSound(){generation++;if(player){player.pause();player.currentTime=0;}}
export function prepareShutterSound(){const choice=currentShutterSound();if(!player||selected!==choice.id){stopShutterSound();selected=choice.id;player=new Audio(`${import.meta.env.BASE_URL}audio/${choice.file}`);player.preload='auto';player.load();}}
export async function playShutterSound(){if(readPreference('camera.shutterSoundEnabled')==='false')return false;try{prepareShutterSound();const current=player!,token=++generation;current.currentTime=0;await current.play();if(token!==generation){current.pause();return false;}return true;}catch{return false;}}
if(typeof window!=='undefined'){window.addEventListener('pagehide',stopShutterSound);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopShutterSound();});}
