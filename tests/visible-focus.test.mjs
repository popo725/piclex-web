import { test } from 'node:test';
import assert from 'node:assert/strict';
import { focusLayout, visibleFocusBox } from '../packages/learning-ui/src/focus.mjs';

test('visible border closes oversized, tall and wide boxes without changing the photo', () => {
 for (const image of [{width:1600,height:1200},{width:800,height:1600},{width:2400,height:800}])
 for (const viewport of [{width:358,height:155},{width:288,height:80},{width:408,height:270},{width:620,height:410}])
 for (const box of [[0,0,1,1],[0,.1,1,.8],[.1,0,.8,1],[0,0,.02,.02],[.98,0,.02,.02],[0,.98,.02,.02],[.98,.98,.02,.02],[.49,.49,.02,.02]]) {
  const layout=focusLayout(image,viewport,{visible:true,box});
  const original=structuredClone(layout);
  const visible=visibleFocusBox(layout.box,viewport);
  assert.ok(visible,JSON.stringify({image,viewport,box}));
  assert.ok(visible.x>=4&&visible.y>=4);
  assert.ok(visible.x+visible.width<=viewport.width-4+1e-8);
  assert.ok(visible.y+visible.height<=viewport.height-4+1e-8);
  assert.ok(visible.width>=30&&visible.height>=30);
  assert.deepEqual(layout,original);
 }
});
test('an ordinary in-bounds box remains aligned, tiny borders expand before clamping',()=>{
 const viewport={width:100,height:80};
 const regular={x:12,y:14,width:40,height:32};
 assert.deepEqual(visibleFocusBox({x:0,y:0,width:1,height:1},viewport),{x:4,y:4,width:30,height:30});
 assert.deepEqual(visibleFocusBox(regular,viewport),regular);
 assert.deepEqual(visibleFocusBox({x:94,y:74,width:2,height:2},viewport),{x:66,y:46,width:30,height:30});
 assert.deepEqual(visibleFocusBox({x:0,y:0,width:100,height:80},{width:20,height:18}),{x:4,y:4,width:12,height:10});
});
test('hidden, outside and invalid boxes do not create misleading borders',()=>{
 for(const rect of [null,{x:-50,y:-50,width:10,height:10},{x:105,y:0,width:10,height:10},{x:0,y:0,width:0,height:1},{x:NaN,y:0,width:20,height:20}])
  assert.equal(visibleFocusBox(rect,{width:100,height:80}),null);
 assert.equal(visibleFocusBox({x:0,y:0,width:20,height:20},{width:8,height:8}),null);
});
