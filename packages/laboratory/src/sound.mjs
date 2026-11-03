import { soundPCM, soundRate } from './sound-data.mjs';
import { musicPCM, musicRate } from './music-data.mjs';
import { achievementPCM } from './achievement-sound-data.mjs';

// Combat voices are budgeted separately so automatic weapons cannot starve the
// click/pickup/spell/purchase feedback of the shared noncombat voice pool.
const MAX_VOICES=8,MAX_COMBAT_VOICES=3;
const COMBAT_NAMES=new Set(['shot','rapid-shot','cannon','laser-shot','magic-shot','melee-swing','explosion']);
// Per-kind cooldowns: fast weapons fire every ~.05s, heavy blasts stay sparse.
const COOLDOWNS={'step':.26,'pickup':.055,'spell':.035,'shot':.055,'rapid-shot':.05,'cannon':.25,'laser-shot':.06,'magic-shot':.06,'melee-swing':.09,'explosion':.12,'slot':0};
const MUSIC_PHASES=new Set(['ready','battle','shop','upgrade','loot']);

// PCM is embedded so the same sounds work in both a browser and an offline file WKWebView.
export class LabSound {
  constructor({factory=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)(),hidden=()=>!!globalThis.document?.hidden}={}) {
    this.factory=factory;this.hidden=hidden;this.context=null;this.master=null;this.buffers={};this.sources=new Set();this.combat=new Set();this.kindCounts=new Map();this.last=new Map();this.blocked=false;this.generation=0;this.ducked=false;
    this.enabled=true;this.musicEnabled=true;
    this.musicPhase='ready';this.musicSource=null;this.musicBuffer=null;this.musicOffset=0;this.musicStarted=0;
    this.lastNativeActivation=-Infinity;
  }
  unlock({native=true}={}) {
    if((!this.enabled&&!this.musicEnabled)||this.hidden())return;
    const needsActivation=!this.context||this.context.state!=='running'||this.blocked;
    this.blocked=false;
    // Activate the native route first, even if Web Audio still reports running
    // after another screen changed the shared session. A native acknowledgement
    // retries resume without requiring another tap or posting back recursively.
    if(native&&(needsActivation||Date.now()-this.lastNativeActivation>=1000)){
      try{globalThis.webkit?.messageHandlers?.labAudio?.postMessage('activate');this.lastNativeActivation=Date.now();}catch{}
    }
    try{
      if(this.context?.state==='closed'){
        this.stopEffects();this.stopMusic();this.context=null;this.buffers={};this.musicBuffer=null;
      }
      if(!this.context){
        this.context=this.factory();this.master=this.context.createGain();this.master.connect(this.context.destination);
        this.musicGain=this.context.createGain();this.musicGain.connect(this.context.destination);
        const context=this.context;
        context.onstatechange=()=>{
          if(this.context!==context||this.blocked||this.hidden())return;
          if(context.state==='running'){this.updateVolume();this.ensureMusic();}
          else if(context.state==='interrupted'){this.stopEffects();this.stopMusic();}
        };
        for(const [name,base64] of Object.entries({...soundPCM,achievement:achievementPCM})){
          const raw=atob(base64),buffer=this.context.createBuffer(1,raw.length/2,soundRate),channel=buffer.getChannelData(0);
          for(let i=0;i<channel.length;i++){let sample=raw.charCodeAt(i*2)|(raw.charCodeAt(i*2+1)<<8);if(sample>=32768)sample-=65536;channel[i]=sample/32768;}
          this.buffers[name]=buffer;
        }
      }
      const token=this.generation;
      const context=this.context;
      if(context.state!=='running')void context.resume().then(()=>{
        if(this.context!==context)return;
        if(token===this.generation&&!this.blocked&&!this.hidden()){this.updateVolume();this.ensureMusic();}
        else if(this.blocked||this.hidden())void context.suspend().catch(()=>{});
      }).catch(()=>{});
      this.updateVolume();
      this.ensureMusic();
    }catch{ /* Silent devices keep the game playable. */ }
  }
  recover(){if(!this.blocked&&!this.hidden())this.unlock({native:false});}
  updateVolume(){
    if(!this.context)return;
    if(this.master)this.master.gain.setValueAtTime(this.ducked?.12:.65,this.context.currentTime);
    if(this.musicGain){
      const param=this.musicGain.gain,now=this.context.currentTime;
      const target=!this.musicEnabled||this.blocked?0:this.ducked?.025:['ready','shop','upgrade','loot'].includes(this.musicPhase)?.12:.4;
      param.cancelScheduledValues?.(now);
      if(param.linearRampToValueAtTime){param.setValueAtTime(param.value,now);param.linearRampToValueAtTime(target,now+.15);}
      else param.setValueAtTime(target,now);
    }
  }
  setMusicPhase(phase){
    this.musicPhase=phase;
    if(!MUSIC_PHASES.has(phase)){this.stopMusic();if(phase!=='paused')this.musicOffset=0;}
    this.updateVolume();this.ensureMusic();
  }
  ensureMusic(){
    const ctx=this.context;
    if(!this.musicEnabled||this.blocked||this.hidden()||!ctx||ctx.state!=='running'||this.musicSource||!MUSIC_PHASES.has(this.musicPhase))return;
    try{
      if(!this.musicBuffer){
        const raw=atob(musicPCM),buffer=ctx.createBuffer(1,raw.length/2,musicRate),data=buffer.getChannelData(0);
        for(let i=0;i<data.length;i++){let n=raw.charCodeAt(i*2)|(raw.charCodeAt(i*2+1)<<8);if(n>=32768)n-=65536;data[i]=n/32768;}
        this.musicBuffer=buffer;
      }
      const source=ctx.createBufferSource();source.buffer=this.musicBuffer;source.loop=true;source.connect(this.musicGain);
      this.musicSource=source;this.musicStarted=ctx.currentTime;
      this.musicGain.gain.setValueAtTime(0,ctx.currentTime);this.updateVolume();
      source.onended=()=>{source.disconnect();if(this.musicSource===source)this.musicSource=null;};
      source.start(0,this.musicOffset);
    }catch{this.musicSource=null;}
  }
  stopMusic(){
    const source=this.musicSource;if(!source)return;
    this.musicOffset=(this.musicOffset+this.context.currentTime-this.musicStarted)%(this.musicBuffer.length/musicRate);
    this.musicSource=null;try{source.stop();source.disconnect();}catch{}
  }
  duck(value){this.ducked=value;this.updateVolume();}
  play(name) {
    const ctx=this.context;
    if(!this.enabled||this.blocked||this.hidden()||!ctx||ctx.state!=='running'||!this.buffers[name]||this.sources.size>=MAX_VOICES+(name==='achievement'?1:0))return false;
    const combat=COMBAT_NAMES.has(name);
    if(combat&&this.combat.size>=MAX_COMBAT_VOICES)return false;
    const now=ctx.currentTime,key=name.startsWith('step')?'step':name;
    const cooldown=COOLDOWNS[key]??.05;
    if(now-(this.last.get(key)??-Infinity)<cooldown)return false;
    this.last.set(key,now);
    try{
      const source=ctx.createBufferSource();source.buffer=this.buffers[name];source.playbackRate.value=name==='achievement'?1:.97+Math.random()*.06;source.connect(this.master);
      this.sources.add(source);if(combat)this.combat.add(source);this.kindCounts.set(name,(this.kindCounts.get(name)??0)+1);
      source.onended=()=>this.release(source,name,combat);source.start();return true;
    }catch{return false;}
  }
  release(source,name,combat){
    if(!this.sources.delete(source))return;
    if(combat)this.combat.delete(source);
    const count=this.kindCounts.get(name)??0;if(count<=1)this.kindCounts.delete(name);else this.kindCounts.set(name,count-1);
    try{source.disconnect();}catch{}
  }
  pause() {
    this.blocked=true;this.generation++;this.stopEffects();this.stopMusic();
    if(this.context)void this.context.suspend().catch(()=>{});
  }
  stopEffects(){for(const source of this.sources){try{source.stop();source.disconnect();}catch{}}this.sources.clear();this.combat.clear();this.kindCounts.clear();this.last.clear();}
  setEnabled(enabled){this.enabled=enabled;if(enabled)this.unlock();else{this.stopEffects();if(!this.musicEnabled)this.pause();}}
  setMusicEnabled(enabled){this.musicEnabled=enabled;if(enabled)this.unlock();else{this.stopMusic();this.updateVolume();if(!this.enabled)this.pause();}}
}
