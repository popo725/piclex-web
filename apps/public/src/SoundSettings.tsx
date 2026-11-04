import {useExperience} from './Experience';
import {useEffect,useState} from 'react';
import {readPreference,writePreference} from './storage';
import {shutterSounds,currentShutterSound,prepareShutterSound,playShutterSound,stopShutterSound} from './shutter-sound';
import {englishVoices,voiceKey} from './speech-voice';
import {useSpeech} from './useSpeech';
export function ShutterSettings({notify}:{notify:(message:string)=>void}){
 const xp=useExperience();const [enabled,setEnabled]=useState(()=>readPreference('camera.shutterSoundEnabled')!=='false'),[selected,setSelected]=useState(()=>currentShutterSound().id);
 useEffect(()=>{if(enabled)prepareShutterSound();return stopShutterSound;},[enabled]);
 function preview(){if(!enabled){notify('请先开启拍照快门音。');return;}void playShutterSound().then(ok=>{if(!ok)notify('暂时无法试听，请检查音量后重试。');});}
 return <><label className="settings-row"><span>拍照快门音</span><input aria-label="拍照快门音" type="checkbox" role="switch" checked={enabled} onChange={e=>{setEnabled(e.target.checked);writePreference('camera.shutterSoundEnabled',String(e.target.checked));if(!e.target.checked)stopShutterSound();}}/></label><label className="settings-row"><span>快门音</span><select aria-label="快门音" value={selected} onChange={e=>{setSelected(e.target.value);writePreference('camera.shutterSoundID',e.target.value);preview();}}>{shutterSounds.map(s=><option value={s.id} key={s.id} disabled={s.id!=='minolta'&&xp.level<4}>{s.label}{s.id!=='minolta'&&xp.level<4?' · LV4 解锁':''}</option>)}</select></label><button className="settings-row" onClick={preview}>试听当前快门音</button><p className="settings-footnote">拍摄时自动播放所选声音；听不到时请调高设备媒体音量。</p></>;
}
export function SpeechSettings({notify}:{notify:(message:string)=>void}){
 const [voices,setVoices]=useState(englishVoices),[selected,setSelected]=useState(()=>readPreference(voiceKey)||'');const audio=useSpeech(notify);
 useEffect(()=>{const synth=window.speechSynthesis;if(!synth)return;const update=()=>setVoices(englishVoices());synth.addEventListener('voiceschanged',update);update();return()=>synth.removeEventListener('voiceschanged',update);},[]);
 const available=voices.some(v=>v.voiceURI===selected);
 return <><label className="settings-row"><span>朗读声音</span><select aria-label="朗读声音" value={available?selected:''} onChange={e=>{audio.stop();setSelected(e.target.value);writePreference(voiceKey,e.target.value);}}><option value="">自动</option>{voices.map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name}（{v.lang}）</option>)}</select></label><button className="settings-row" disabled={!window.speechSynthesis} onClick={()=>audio.play(['The sunlight shines through the window, making the room warm and bright.'])}>试听当前声音</button><p className="settings-footnote">使用当前浏览器提供的英文声音。卡组内已有的原音频保持不变。</p>{selected&&!available&&<p role="status">所选声音在当前设备不可用，暂时使用自动声音。</p>}</>;
}
