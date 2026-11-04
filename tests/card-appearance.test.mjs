import test from 'node:test';import assert from 'node:assert/strict';
import {resolveCardLabels,labelGlass,calloutRects,contains,connector} from '../packages/deck-format/src/card-appearance.mjs';
test('native glass keeps distinct fixed hues and white text readable over a white photograph',()=>{
 const labels=resolveCardLabels(Array.from({length:8},(_,i)=>({english:`word ${i}`,backgroundColor:i?'#888888':'#C33D21'})));assert.equal(new Set(labels.map(l=>l.backgroundColor)).size,8);
 assert.deepEqual(resolveCardLabels(labels),labels);
 for(const label of labels){const {rgb}=labelGlass(label.backgroundColor),surface=rgb.map(c=>(c/255*.88+.12)*.86+.14),linear=surface.map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4),lum=linear.reduce((n,c,i)=>n+c*[.2126,.7152,.0722][i],0);assert.ok(1.05/(lum+.05)>=4.58);assert.equal(label.textColor,'#FFFFFF');}
 const neutral=labelGlass('#888888').rgb;assert.equal(neutral[0],neutral[1]);assert.equal(neutral[1],neutral[2]);
});
test('callouts avoid clustered object anchors, remain inside the image and connect from label edges',()=>{
 const photo={width:1000,height:1333},anchors=[{x:150,y:250},{x:165,y:265},{x:550,y:850},{x:920,y:100}],sizes=anchors.map(()=>({width:185,height:82.88}));const boxes=calloutRects(photo,anchors,sizes);
 boxes.forEach((box,i)=>{assert.ok(box.x>=8&&box.y>=8&&box.x+box.width<=992&&box.y+box.height<=1325);assert.ok(anchors.every(a=>!contains(box,a,9)));const line=connector(box,anchors[i]);assert.deepEqual(line.end,anchors[i]);assert.ok(Math.min(Math.abs(line.start.x-box.x),Math.abs(line.start.x-box.x-box.width),Math.abs(line.start.y-box.y),Math.abs(line.start.y-box.y-box.height))<.00001);});
});
