/** Coalesce typing writes without losing the latest committed state on exit. */
export function bufferedSave(save,{delay=180,maxDelay=1000,setTimer=setTimeout,clearTimer=clearTimeout}={}){
 let latest,pending=false,timer=null,deadline=null;
 const clear=()=>{if(timer!==null)clearTimer(timer);if(deadline!==null)clearTimer(deadline);timer=deadline=null;};
 const flush=()=>{clear();if(!pending)return true;const value=latest;pending=false;const ok=save(value);if(!ok){latest=value;pending=true;}return ok;};
 return {flush,schedule(value){latest=value;pending=true;if(timer!==null)clearTimer(timer);timer=setTimer(flush,delay);if(deadline===null)deadline=setTimer(flush,maxDelay);}};
}
