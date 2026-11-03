import { fixed, board, boardMismatch } from './spelling.mjs';
import CharacterRipples from './CharacterRipples';
export function AnswerSlots({ expected, entered, revealed, scope }: { expected: string; entered: string; revealed: boolean; scope: string }) {
  const value = board(expected, entered, null), wrong = boardMismatch(expected, entered, null);
  return <div className="answer-slots" aria-hidden="true">
    {[...value].map((char, index) => <span key={index} data-letter-index={index} className={`letter-slot ${fixed(expected[index]) ? 'fixed' : ''} ${wrong === index ? 'wrong' : ''} ${char === '_' ? 'empty' : ''}`}><span className="letter-glyph">{char === '_' ? '\u00a0' : char}</span></span>)}
    <CharacterRipples scope={scope} expected={expected} entered={entered} revealed={revealed} active={!revealed} />
  </div>;
}
