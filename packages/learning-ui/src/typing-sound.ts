let voices:HTMLAudioElement[]=[];let index=0;
export function prepareTypingSound(){
 if(voices.length)return;
 voices=Array.from({length:4},()=>{const voice=new Audio(`${import.meta.env.BASE_URL}audio/key-click.wav`);voice.preload='auto';voice.load();return voice;});
}
export function playTypingSound(){if(document.hidden)return;prepareTypingSound();const voice=voices[index++%voices.length];voice.currentTime=0;void voice.play().catch(()=>{});}
export function stopTypingSound(){for(const voice of voices){voice.pause();voice.currentTime=0;}}
