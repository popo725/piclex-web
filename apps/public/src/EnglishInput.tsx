import {forwardRef,useRef,useState,type KeyboardEvent,type ClipboardEvent} from 'react';
type Field=HTMLInputElement|HTMLTextAreaElement;
type Props={value:string;onValue:(value:string,advance:boolean)=>void;onWarning:(show:boolean)=>void;onComposing?:(active:boolean)=>void;label:string;multiline?:boolean;className?:string;disabled?:boolean;readOnly?:boolean;autoFocus?:boolean;maxLength?:number;placeholder?:string;onKeyDown?:(event:KeyboardEvent<Field>)=>void;onPaste?:(event:ClipboardEvent<Field>)=>void};
const needsEnglish=(text:string)=>/[\p{Script=Han}\u3000-\u303f\uff01-\uff60]/u.test(text);
/** Keep IME pre-edit text out of learning state and preserve the last English answer. */
const EnglishInput=forwardRef<Field,Props>(function EnglishInput({value,onValue,onWarning,onComposing,label,multiline=false,onKeyDown,onPaste,...rest},ref){
 const composing=useRef(false),pendingCommit=useRef<string|null>(null),[draft,setDraft]=useState<string|null>(null);
 const accept=(text:string,advance:boolean)=>{if(needsEnglish(text)){onWarning(true);return;}onWarning(false);onValue(text,advance);};
 const attributes={...rest,'aria-label':label,lang:'en',autoComplete:'off',autoCapitalize:'none',autoCorrect:'off',spellCheck:false,
  value:draft??value,
  ref:(node:Field|null)=>{if(typeof ref==='function')ref(node);else if(ref)ref.current=node;},
  onCompositionStart:(event:React.CompositionEvent<Field>)=>{composing.current=true;pendingCommit.current=null;setDraft(event.currentTarget.value);onWarning(true);onComposing?.(true);},
  onCompositionUpdate:()=>onWarning(true),
  onCompositionEnd:(event:React.CompositionEvent<Field>)=>{const text=event.currentTarget.value;composing.current=false;pendingCommit.current=text;setDraft(null);onComposing?.(false);if(needsEnglish(text)){onWarning(true);return;}onValue(text,false);},
  onChange:(event:React.ChangeEvent<Field>)=>{const text=event.currentTarget.value;if(composing.current||(event.nativeEvent as InputEvent).isComposing){setDraft(text);onWarning(true);return;}if(pendingCommit.current!==null&&(pendingCommit.current===text||value===text)){pendingCommit.current=null;return;}pendingCommit.current=null;setDraft(null);accept(text,true);},
  onPaste:(event:ClipboardEvent<Field>)=>{if(needsEnglish(event.clipboardData.getData('text'))){event.preventDefault();onWarning(true);return;}onWarning(false);onPaste?.(event);},
  onKeyDown:(event:KeyboardEvent<Field>)=>{if(composing.current||event.nativeEvent.isComposing||event.keyCode===229){onWarning(true);event.stopPropagation();return;}onKeyDown?.(event);}
 };
 return multiline?<textarea {...attributes}/>:<input {...attributes}/>;
});
export default EnglishInput;
