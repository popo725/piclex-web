// Pure single-row layout math for the spelling board. The answer slots and the
// shuffled letter bank are two separate rows (never wrapped, never paged), so
// each row is sized from its own measured inner width. Words up to SHORT_MAX
// cells shrink both the tile and the gap until the row fits; longer words keep a
// legible, tappable tile and scroll horizontally instead. These helpers contain
// no DOM access, which keeps the sizing testable and the render tree stable.

// Words at or below this many rendered cells (fixed separators included) must
// fit entirely inside their row without scrolling.
export const SHORT_MAX = 20;
// Long words keep this tile size so every block stays clear and tappable; the
// extra cells overflow into a horizontal scroll instead of shrinking further.
export const LONG_TILE = 36;
export const LONG_GAP = 6;

// The gap gets tighter as the row grows, freeing width for the glyphs.
const SHORT_GAPS = [[8, 6], [12, 5], [16, 4], [20, 3]];
export function shortGap(count) {
  for (const [limit, gap] of SHORT_GAPS) if (count <= limit) return gap;
  return 3;
}

// Geometry for one row of `count` square `size`px cells separated by `gap`px.
// `scroll` is true when the row's content is wider than the measured width, so
// the caller can switch the container to overflow-x:auto. `content` is the row's
// rendered width, useful for assertions and edge hints.
export function singleRowLayout({ width, count, shortMax = SHORT_MAX, max = 60, min = 1, longTile = LONG_TILE, longGap = LONG_GAP } = {}) {
  const cells = Math.max(0, Math.floor(count));
  if (cells === 0) return { size: max, gap: 0, scroll: false, content: 0 };
  const available = Math.max(0, width);
  if (cells > shortMax) {
    const content = cells * longTile + (cells - 1) * longGap;
    return { size: longTile, gap: longGap, scroll: content > available + 0.5, content };
  }
  const gap = shortGap(cells);
  const raw = Math.floor((available - (cells - 1) * gap) / cells);
  const size = Math.max(min, Math.min(max, raw));
  const content = cells * size + (cells - 1) * gap;
  return { size, gap, scroll: content > available + 0.5, content };
}

// Combine the two measured rows into the single geometry both share: the tile
// is the smaller of the two so neither row ever wraps, the gap is the smaller so
// the tighter row still fits, and either row overflowing turns on scrolling.
export function sharedRowLayout(answer, bank) {
  return { size: Math.max(1, Math.min(answer.size, bank.size)), gap: Math.min(answer.gap, bank.gap), scroll: !!(answer.scroll || bank.scroll) };
}

// Tile glyph size for a cell, kept readable when the cell is very small and
// bounded so a comfortable short word does not get oversized type.
export function tileFontSize(size, { min = 10, max = 28, ratio = 0.46 } = {}) {
  return Math.max(min, Math.min(max, Math.round(size * ratio)));
}
