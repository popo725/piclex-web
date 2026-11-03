import { fixed, board, boardMismatch } from './spelling.mjs';
import CharacterRipples from './CharacterRipples';
export function AnswerSlots({ expected, entered, revealed, scope, quickIndices=null,active=true }: { expected: string; entered: string; revealed: boolean; scope: string; quickIndices?:number[]|null;active?:boolean }) {
  const inputExpected=quickIndices?quickIndices.map(i=>[...expected][i]).join(''):expected;
  const value=revealed?expected:board(expected,entered,quickIndices),wrong=revealed?null:boardMismatch(inputExpected,entered,quickIndices);
  const next=[...value].findIndex((c,i)=>c==='_'&&!fixed(expected[i]));
  return <div className="answer-slots" aria-hidden="true" style={{fontSize:Math.max(14,Math.min(28,300/[...expected].length))}}>
    {[...value].map((char,index)=><span key={index} data-letter-index={index} className={`letter-slot ${fixed(expected[index])?'fixed':''} ${wrong===index?'wrong':''} ${char==='_'?'empty':''} ${index===next?'next-letter':''} ${quickIndices&&!quickIndices.includes(index)?'prefilled':''}`}><span className="letter-glyph">{char==='_'?'\u00a0':char}</span></span>)}
    <CharacterRipples scope={scope} expected={expected} entered={entered} quickIndices={quickIndices} revealed={revealed} active={active&&!revealed}/>
  </div>;
}
