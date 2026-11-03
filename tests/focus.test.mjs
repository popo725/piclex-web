import { test } from 'node:test';
import assert from 'node:assert/strict';
import { focusLayout } from '../packages/learning-ui/src/focus.mjs';

// Expected values come from PracticeFocusGeometry.layout in PracticeDeck.swift,
// transcribed for the 408×270 native practice card and the desktop card.
const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 0.02, `${label}: ${actual} ≠ ${expected}`);

test('a centered object keeps its context and stays centered', () => {
  const layout = focusLayout({ width: 1600, height: 1200 }, { width: 408, height: 270 }, { visible: true, box: [0.4, 0.4, 0.2, 0.2] });
  near(layout.image.x, -122.25, 'image.x'); near(layout.image.y, -109.69, 'image.y');
  near(layout.image.width, 652.50, 'image.width'); near(layout.image.height, 489.37, 'image.height');
  near(layout.box.x, 138.75, 'box.x'); near(layout.box.y, 86.06, 'box.y');
  near(layout.box.width, 130.50, 'box.width'); near(layout.box.height, 97.87, 'box.height');
  near(layout.box.x + layout.box.width / 2, 204, 'box center x');
  near(layout.box.y + layout.box.height / 2, 135, 'box center y');
});

test('an object at the photo corner keeps that corner in the corner', () => {
  const layout = focusLayout({ width: 1600, height: 1200 }, { width: 408, height: 270 }, { visible: true, box: [0, 0, 0.2, 0.2] });
  near(layout.image.x, 0, 'image.x'); near(layout.image.y, 0, 'image.y');
  near(layout.image.width, 803.08, 'image.width'); near(layout.image.height, 602.31, 'image.height');
  near(layout.box.x, 0, 'box.x'); near(layout.box.y, 0, 'box.y');
  near(layout.box.width, 160.62, 'box.width'); near(layout.box.height, 120.46, 'box.height');
});

test('a tiny object never zooms past the native 3.2 limit', () => {
  const layout = focusLayout({ width: 1600, height: 1200 }, { width: 408, height: 270 }, { visible: true, box: [0.49, 0.49, 0.02, 0.02] });
  near(layout.image.width, 1305.60, 'image.width'); near(layout.image.height, 979.20, 'image.height');
  near(layout.box.x, 190.94, 'box.x'); near(layout.box.y, 125.21, 'box.y');
  near(layout.box.width, 26.11, 'box.width'); near(layout.box.height, 19.58, 'box.height');
});

test('a hidden object shows the whole photo without a box', () => {
  const layout = focusLayout({ width: 1600, height: 1200 }, { width: 408, height: 270 }, { visible: false, box: [0.4, 0.4, 0.2, 0.2] });
  near(layout.image.x, 24, 'image.x'); near(layout.image.y, 0, 'image.y');
  near(layout.image.width, 360, 'image.width'); near(layout.image.height, 270, 'image.height');
  assert.equal(layout.box, null);
  assert.equal(focusLayout({ width: 1600, height: 1200 }, { width: 408, height: 270 }, undefined).box, null);
});

test('the desktop card frames the same area as the phone card', () => {
  const layout = focusLayout({ width: 2000, height: 1500 }, { width: 620, height: 410.3 }, { visible: true, box: [0.25, 0.3, 0.3, 0.25] });
  near(layout.image.x, -7.30, 'image.x'); near(layout.image.y, -47.70, 'image.y');
  near(layout.image.width, 793.25, 'image.width'); near(layout.image.height, 594.93, 'image.height');
  near(layout.box.x, 191.01, 'box.x'); near(layout.box.y, 130.78, 'box.y');
  near(layout.box.width, 237.97, 'box.width'); near(layout.box.height, 148.73, 'box.height');
});

test('degenerate sizes return no layout', () => {
  assert.equal(focusLayout({ width: 0, height: 0 }, { width: 408, height: 270 }, { visible: true, box: [0, 0, 1, 1] }), null);
  assert.equal(focusLayout(undefined, { width: 408, height: 270 }, undefined), null);
  assert.equal(focusLayout({ width: 1600, height: 1200 }, { width: 0, height: 0 }, { visible: true, box: [0, 0, 1, 1] }), null);
});
