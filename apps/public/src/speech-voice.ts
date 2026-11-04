import {readPreference} from './storage';
export const voiceKey='practice.speechVoiceIdentifier';
export function englishVoices(){return (window.speechSynthesis?.getVoices()||[]).filter(v=>/^en(-|_|$)/i.test(v.lang)).sort((a,b)=>Number(/^en-US$/i.test(b.lang))-Number(/^en-US$/i.test(a.lang))||a.name.localeCompare(b.name));}
export function selectedSpeechVoice(){const voices=englishVoices(),id=readPreference(voiceKey);return voices.find(v=>v.voiceURI===id)||voices[0];}
