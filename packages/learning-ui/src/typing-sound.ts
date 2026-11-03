let voices:HTMLAudioElement[]=[];let index=0;
export function playTypingSound(){if(document.hidden)return;if(!voices.length)voices=Array.from({length:4},()=>new Audio(`${import.meta.env.BASE_URL}audio/key-click.wav`));const voice=voices[index++%voices.length];voice.currentTime=0;void voice.play().catch(()=>{});}
export function stopTypingSound(){for(const voice of voices){voice.pause();voice.currentTime=0;}}
