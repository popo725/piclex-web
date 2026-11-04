// Same independent two-voice success cue as App PracticeView.
let voices:HTMLAudioElement[]=[];let index=0;
export function prepareCompletionSound(){
 if(voices.length)return;
 voices=Array.from({length:2},()=>{const voice=new Audio(`${import.meta.env.BASE_URL}audio/correct-word.wav`);voice.preload='auto';voice.load();return voice;});
}
export function playCompletionSound(){
 if(document.hidden)return;
 try{prepareCompletionSound();const voice=voices[index++%voices.length];voice.currentTime=0;void voice.play().catch(()=>{});}catch{/* Feedback cannot block answer submission. */}
}
export function stopCompletionSound(){for(const voice of voices){voice.pause();voice.currentTime=0;}}
