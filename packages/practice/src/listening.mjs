// SentenceListeningPlaylist / SentenceListeningRepeatMode in the native app.
export const repeatModes = [['five','单句播五遍'],['once','单句播一遍'],['fastThreeSlowTwo','单句快3慢2'],['single','仅单句循环']];
export function listeningPlaylist(prompts, words, singleCard, preferredKey) {
 if (!singleCard) return prompts.map((_,index)=>index);
 const preferred=prompts.findIndex(p=>p.key===preferredKey),seen=new Set();
 return prompts.flatMap((prompt,index)=>{
  if(words[prompt.wordIndex]?.occurrenceID) return [index];
  if(seen.has(prompt.imageIndex)) return [];
  seen.add(prompt.imageIndex);
  return [preferred>=0&&!words[prompts[preferred].wordIndex]?.occurrenceID&&prompts[preferred].imageIndex===prompt.imageIndex?preferred:index];
 });
}
export function listeningNeighbor(playlist,current,offset) {
 if(!playlist.length)return current;
 const at=Math.max(0,playlist.indexOf(current));
 return playlist[(at+offset%playlist.length+playlist.length)%playlist.length];
}
