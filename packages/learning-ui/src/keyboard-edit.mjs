// UTF-16 selections are the browser's native input contract; delete whole code points.
export function editKeyboardText(value,start,end,key){
 start=Math.max(0,Math.min(value.length,start??value.length));end=Math.max(start,Math.min(value.length,end??start));
 let text=key;
 if(key==='Backspace'){if(start===end&&start>0)start-=[...value.slice(0,start)].at(-1).length;text='';}
 else if(key==='Delete'){if(start===end&&end<value.length)end+=[...value.slice(end)][0].length;text='';}
 else if([...key].length!==1)return null;
 return {value:value.slice(0,start)+text+value.slice(end),cursor:start+text.length};
}
