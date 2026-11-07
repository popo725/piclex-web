export type DefinitionResult =
  {state:'found';meaning:string}|{state:'missing'}|{state:'error'};

const shardCache=new Map<string,Promise<Record<string,string>|null>>();
const VALID_WORD=/^[a-z]+(?:['\-][a-z]+)*$/;

export function normalizeDefinitionWord(value:string){
  return value.replace(/[’‘ʼ＇]/g,"'").trim().toLowerCase();
}

async function loadShard(letter:string):Promise<Record<string,string>|null>{
  const url=new URL(`${import.meta.env.BASE_URL}dictionary/${letter}.json`,location.href);
  try{
    const response=await fetch(url,{cache:'force-cache',credentials:'omit'});
    if(!response.ok)return null;
    const data=await response.json();
    return data&&typeof data==='object'&&!Array.isArray(data)?data as Record<string,string>:null;
  }catch{return null;}
}

/** Load only the held word's first-letter shard, once per session. */
export function lookupWordDefinition(word:string):Promise<DefinitionResult>{
  const key=normalizeDefinitionWord(word);
  if(!VALID_WORD.test(key))return Promise.resolve({state:'missing'});
  const letter=key[0];
  let request=shardCache.get(letter);
  if(!request){request=loadShard(letter);shardCache.set(letter,request);}
  return request.then(shard=>{
    if(!shard){if(shardCache.get(letter)===request)shardCache.delete(letter);return {state:'error'};}
    const meaning=Object.hasOwn(shard,key)?shard[key]:undefined;
    return typeof meaning==='string'&&meaning?{state:'found',meaning}:{state:'missing'};
  });
}
