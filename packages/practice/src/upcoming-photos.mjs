/** Follow the same cursors as learning, counting distinct photos rather than words. */
export function upcomingPhotos(deck,state,prompts,playlist,limit=5){
 const current=deck.images[deck.words[state.index]?.imageIndex];if(!current)return [];
 const seen=new Set([current]),result=[];
 const add=index=>{const src=deck.images[deck.words[index]?.imageIndex];if(src&&!seen.has(src)){seen.add(src);result.push(src);}return result.length>=limit;};
 if(state.module==='listening'){
  if(state.sentenceFinished)return [];
  if(state.mode==='listening'){
   const at=playlist.indexOf(state.sentenceIndex);
   for(let offset=1;at>=0&&offset<playlist.length;offset++)if(add(prompts[playlist[(at+offset)%playlist.length]]?.wordIndex))break;
  }else for(let i=state.sentenceIndex+1;i<prompts.length;i++)if(add(prompts[i].wordIndex))break;
 }else for(let i=state.index+1;i<deck.words.length;i++){
  if(state.module==='spelling'&&state.quick&&state.history[deck.words[i].id]?.mastered)continue;
  if(add(i))break;
 }
 return result;
}
