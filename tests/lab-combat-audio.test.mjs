import test from 'node:test';
import assert from 'node:assert/strict';
import { LabSound } from '../packages/laboratory/src/sound.mjs';
import { soundPCM } from '../packages/laboratory/src/sound-data.mjs';
import { weaponEntries } from '../packages/laboratory/src/content.mjs';
import { weaponSound } from '../packages/laboratory/src/combat-audio.mjs';

const COMBAT=['shot','rapid-shot','cannon','laser-shot','magic-shot','melee-swing','explosion'];

function fixture(){
 let hidden=false,starts=0,stops=0,last=null;
 const context={state:'suspended',currentTime:1,destination:{},createGain:()=>({gain:{setValueAtTime(){}},connect(){}}),createBuffer:(channels,length,rate)=>({getChannelData:()=>new Float32Array(length)}),resume(){this.state='running';return Promise.resolve();},suspend(){this.state='suspended';return Promise.resolve();},createBufferSource:()=>{const source={playbackRate:{value:1},onended:null,connect(){},disconnect(){},start(){starts++;},stop(){stops++;}};last=source;return source;}};
 const sound=new LabSound({factory:()=>context,hidden:()=>hidden});sound.setMusicPhase('won');return {sound,context,setHidden:v=>hidden=v,starts:()=>starts,stops:()=>stops,last:()=>last};
}

test('every real content weapon family maps to the intended combat effect and unknown weapons stay silent',()=>{
 const expected={lightning_shiv:'magic-shot',wand:'magic-shot',laser:'laser-shot',shredder:'cannon',smg:'rapid-shot',minigun:'rapid-shot',fork:'melee-swing',knife:'melee-swing',stick:'melee-swing',fist:'melee-swing',ghost_axe:'melee-swing',ghost_flint:'melee-swing',power_fist:'melee-swing',chopper:'melee-swing',thunder_sword:'melee-swing',pea:'shot',scatter:'shot',slingshot:'shot',crossbow:'shot',medical_gun:'shot'};
 for(const [id,sound] of Object.entries(expected)){const w=weaponEntries.find(entry=>entry.id===id);assert.ok(w,id);assert.equal(weaponSound(w),sound,id);}
 for(const w of weaponEntries)assert.ok(soundPCM[weaponSound(w)],w.id);
 assert.equal(weaponSound(null),null);assert.equal(weaponSound(undefined),null);assert.equal(weaponSound({}),null);assert.equal(weaponSound({id:'nope',type:'summon'}),null);
});

test('combat attack keys play only after gesture unlock, with per-kind rapid cooldowns',async()=>{
 const f=fixture();for(const name of COMBAT)assert.equal(f.sound.play(name),false,name);
 f.sound.unlock();await Promise.resolve();
 for(const name of COMBAT){f.sound.stopEffects();assert.equal(f.sound.play(name),true,name);}
 f.sound.stopEffects();
 assert.equal(f.sound.play('rapid-shot'),true);
 assert.equal(f.sound.play('rapid-shot'),false);
 f.context.currentTime+=.05;assert.equal(f.sound.play('rapid-shot'),true);
 f.context.currentTime+=.04;assert.equal(f.sound.play('rapid-shot'),false);
 f.context.currentTime+=.01;assert.equal(f.sound.play('rapid-shot'),true);
 f.sound.stopEffects();
 f.context.currentTime+=.11;assert.equal(f.sound.play('explosion'),true);
 f.context.currentTime+=.01;assert.equal(f.sound.play('explosion'),false);
});

test('combat voices are capped separately so pickup feedback still has a voice',()=>{
 const f=fixture();f.sound.unlock();
 assert.equal(f.sound.play('shot'),true);assert.equal(f.sound.play('cannon'),true);assert.equal(f.sound.play('laser-shot'),true);
 assert.equal(f.sound.combat.size,3);
 assert.equal(f.sound.play('rapid-shot'),false);assert.equal(f.sound.play('explosion'),false);assert.equal(f.sound.play('magic-shot'),false);
 assert.equal(f.sound.play('pickup'),true);
 assert.equal(f.sound.combat.size,3);assert.equal(f.sound.sources.size,4);
 assert.equal(f.sound.play('melee-swing'),false);
});

test('releasing a combat voice on ended frees its slot and clears per-kind bookkeeping',()=>{
 const f=fixture();f.sound.unlock();
 f.sound.play('shot');f.sound.play('cannon');f.sound.play('laser-shot');
 assert.equal(f.sound.play('rapid-shot'),false);
 const ended=f.last();ended.onended();
 assert.equal(f.sound.combat.size,2);assert.equal(f.sound.sources.size,2);
 assert.equal(f.sound.kindCounts.has('laser-shot'),false);assert.equal(f.sound.kindCounts.get('shot'),1);
 assert.equal(f.sound.play('rapid-shot'),true);
});

test('disabling effects and backgrounding stop combat voices and clear bookkeeping',async()=>{
 const f=fixture();f.sound.unlock();
 f.sound.play('shot');f.sound.play('pickup');assert.ok(f.sound.sources.size>=2);
 f.sound.setEnabled(false);
 assert.equal(f.sound.sources.size,0);assert.equal(f.sound.combat.size,0);assert.equal(f.sound.kindCounts.size,0);assert.equal(f.sound.last.size,0);
 assert.equal(f.sound.play('shot'),false);
 f.sound.setEnabled(true);await Promise.resolve();assert.equal(f.sound.play('shot'),true);
 f.setHidden(true);f.sound.pause();f.sound.unlock();
 assert.equal(f.sound.play('shot'),false);assert.equal(f.sound.sources.size,0);assert.equal(f.sound.combat.size,0);
 f.setHidden(false);f.sound.unlock();await Promise.resolve();assert.equal(f.sound.play('shot'),true);
});
