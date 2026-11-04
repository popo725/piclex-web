// The native default Minolta recording; option unlocks never gate the shutter.
let player:HTMLAudioElement|undefined;
export function prepareShutterSound(){if(!player){player=new Audio(`${import.meta.env.BASE_URL}audio/minolta-shutter.wav`);player.preload='auto';player.load();}}
export function playShutterSound(){try{if(localStorage.getItem('camera.shutterSoundEnabled')==='false')return;prepareShutterSound();player!.currentTime=0;void player!.play().catch(()=>{});}catch{/* Sound failure must not discard the photograph. */}}
