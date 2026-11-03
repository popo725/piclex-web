import { browserSaveKey } from './export-materials.mjs';
import { captureRun, readRun, RUN_BYTES } from './run-state.mjs';

export const RUN_KEY='piclex.lab.run.v1';

// Native WKWebView is deliberately ephemeral. The bridge persists a single
// checkpoint in the App's own Application Support, independently of cards.
export function runSave({scope=globalThis,storage,onFailure=()=>{},setTimer=setTimeout,clearTimer=clearTimeout}={}){
  const key=browserSaveKey(RUN_KEY,scope);
  const native=scope.PICLEX_LAB_RUN_BRIDGE===1,handler=scope.webkit?.messageHandlers?.labRun;
  let snapshot=null,sequence=0,reported=false,lastPayload='',needsClear=false,pending=new Map();
  const fail=()=>{if(!reported){reported=true;onFailure();}};
  try{
    if(storage===undefined&&!native)storage=scope.localStorage;
    const raw=native?scope.PICLEX_LAB_RUN:storage?.getItem(key);
    const value=typeof raw==='string'?JSON.parse(raw):raw;
    if(value){if(readRun(value))snapshot=value;else fail();}
  }catch{fail();}
  const send=(action,value)=>{
    try{
      const payload=value?JSON.stringify(value):'';
      if(new TextEncoder().encode(payload).length>RUN_BYTES)throw Error('checkpoint too large');
      if(action==='save'&&lastPayload===payload)return true;
      if(native){
        if(!handler)throw Error('missing native run bridge');
        const id=++sequence;
        let finish;const done=new Promise(resolve=>{finish=resolve;});
        const timer=setTimer(()=>{pending.delete(id);lastPayload='';fail();finish(false);},5000);
        pending.set(id,{timer,payload,done,finish,action});
        if(action==='clear')needsClear=true;
        try{handler.postMessage({action,id,...(value?{snapshot:payload}:{})});}
        catch(error){clearTimer(timer);pending.delete(id);finish(false);throw error;}
      }else{
        if(!storage)throw Error('missing browser storage');
        if(action==='clear')storage.removeItem(key);else storage.setItem(key,payload);
      }
      if(!native){reported=false;needsClear=false;}
      snapshot=value;lastPayload=payload;return true;
    }catch{fail();return false;}
  };
  return {
    get snapshot(){return snapshot;},
    clear(){needsClear=true;return send('clear',null);},
    save(game){
      try{
        // Opening the launch screen must never overwrite a previous adventure.
        if(game.phase==='ready')return needsClear?send('clear',null):true;
        if(game.phase==='won')return snapshot||needsClear?send('clear',null):true;
        const value=captureRun(game);
        if(['dying','lost'].includes(game.phase)&&!value)return snapshot||needsClear?send('clear',null):true;
        return value?send('save',value):true;
      }catch{fail();return false;}
    },
    async flush(){const results=await Promise.all([...pending.values()].map(r=>r.done));return results.every(Boolean)&&!reported;},
    acknowledge(id,success){
      const request=pending.get(id);if(!request)return;
      clearTimer(request.timer);pending.delete(id);
      request.finish(!!success);
      if(!success){lastPayload='';fail();}
      else if(id===sequence){reported=false;needsClear=false;}
    }
  };
}
