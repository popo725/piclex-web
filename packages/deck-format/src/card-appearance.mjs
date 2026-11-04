// Geometry and glass colors ported from App ImagePipeline.swift / PosterRenderer.
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const validHex=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);}
function hsv(c){const max=Math.max(...c),min=Math.min(...c),d=max-min;let h=0;if(d){h=max===c[0]?(c[1]-c[2])/d:max===c[1]?(c[2]-c[0])/d+2:(c[0]-c[1])/d+4;h=(h/6+1)%1;}return [h,max?d/max:0,max];}
function fromHSV(h,s,v){const sector=h*6,i=Math.floor(sector),f=sector-i,p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s);return [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];}
const hex=c=>'#'+c.map(n=>Math.round(n*255).toString(16).padStart(2,'0')).join('').toUpperCase();
const hueDistance=(a,b)=>Math.min(Math.abs(a-b),1-Math.abs(a-b));
export function resolveCardLabels(labels){
 const hues=[],replace=[],result=labels.map(label=>({...label}));
 result.forEach(label=>{if(label.paletteColorIsFixed&&validHex(label.backgroundColor))hues.push(hsv(rgb(label.backgroundColor))[0]);});
 result.forEach((label,index)=>{if(label.paletteColorIsFixed&&validHex(label.backgroundColor))return;const c=validHex(label.backgroundColor)?hsv(rgb(label.backgroundColor)):null;if(c&&c[1]>=.15&&hues.every(h=>hueDistance(h,c[0])>=.07))hues.push(c[0]);else replace.push(index);});
 for(const index of replace){let best=0,distance=-1;for(let n=0;n<72;n++){const h=n/72,d=hues.length?Math.min(...hues.map(v=>hueDistance(v,h))):1;if(d>=distance){best=h;distance=d;}}hues.push(best);result[index].backgroundColor=hex(fromHSV(best,.72,.92));}
 return result.map(label=>({...label,textColor:'#FFFFFF',paletteColorIsFixed:true}));
}
const luminance=c=>c.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
export function labelGlass(color){const [h,s,v]=hsv(rgb(validHex(color)?color:'#800080')),sat=s<.15?0:Math.min(1,Math.max(.7,s*1.18)),initial=clamp(v,.12,.5);let tint=[.12,.12,.12];for(let step=0;step<=50;step++){const candidate=fromHSV(h,sat,initial*(50-step)/50),surface=candidate.map(c=>(c*.88+.12)*.86+.14);if(1.05/(luminance(surface)+.05)>=4.6){tint=candidate;break;}}return {rgb:tint.map(n=>Math.round(n*255)),tint:hex(tint)};}
export const center=r=>({x:r.x+r.width/2,y:r.y+r.height/2});
export function contains(r,p,pad=0){return p.x>=r.x-pad&&p.x<=r.x+r.width+pad&&p.y>=r.y-pad&&p.y<=r.y+r.height+pad;}
export function connector(r,anchor){if(contains(r,anchor))return null;const c=center(r),dx=anchor.x-c.x,dy=anchor.y-c.y;if(Math.abs(dx)<=.001&&Math.abs(dy)<=.001)return null;const t=Math.min(Math.abs(dx)>.001?r.width/2/Math.abs(dx):Infinity,Math.abs(dy)>.001?r.height/2/Math.abs(dy):Infinity);return {start:{x:c.x+dx*t,y:c.y+dy*t},end:anchor};}
export function calloutRects(photo,anchors,sizes,preferred=[]){
 const margin=Math.max(8,photo.width*.008),gap=Math.max(14,photo.width*.016),clearance=Math.max(8,photo.width*.009),line=Math.max(22,photo.width*.024),step=Math.max(gap*1.15,Math.min(photo.width,photo.height)*.035),extra=Math.max(120,Math.min(photo.width,photo.height)*.34),rings=Math.max(1,Math.ceil(extra/step));
 const clampRect=(p,s)=>{const width=Math.min(s.width,Math.max(1,photo.width-margin*2)),height=Math.min(s.height,Math.max(1,photo.height-margin*2));return {x:clamp(p.x,margin+width/2,photo.width-margin-width/2)-width/2,y:clamp(p.y,margin+height/2,photo.height-margin-height/2)-height/2,width,height};};
 const preferredCenter=(a,s)=>{const offset=s.height/2+line,above=a.y-offset-s.height/2>=margin,below=a.y+offset+s.height/2<=photo.height-margin;return {x:a.x,y:a.y+(above&&(a.y>photo.height*.26||!below)?-offset:below?offset:-offset)};};
 const candidates=(a,s,p,clear)=>{const result=[],seen=new Set();const add=point=>{const r=clampRect(point,s);if(anchors.some(anchor=>contains(r,anchor,clear)))return;const c=center(r),key=`${Math.round(c.x)}:${Math.round(c.y)}`;if(!seen.has(key)){seen.add(key);result.push(r);}};
  if(p)for(let ring=0;ring<=rings;ring++){const radius=Math.min(extra,ring*step);for(let i=0;i<(ring?24:1);i++){const angle=i*Math.PI*2/24;add({x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius});}}
  for(let ring=0;ring<=rings;ring++)for(let i=0;i<24;i++){const angle=-Math.PI/2+i*Math.PI*2/24,x=Math.cos(angle),y=Math.sin(angle),boundary=Math.min(Math.abs(x)>.001?s.width/2/Math.abs(x):Infinity,Math.abs(y)>.001?s.height/2/Math.abs(y):Infinity),radius=boundary+line+Math.min(extra,ring*step);add({x:a.x+x*radius,y:a.y+y*radius});}return result;};
 const distance=(r,p)=>Math.hypot(center(r).x-p.x,center(r).y-p.y),density=a=>anchors.filter(p=>Math.hypot(a.x-p.x,a.y-p.y)<Math.min(photo.width,photo.height)*.22).length;
 const order=anchors.map((_,i)=>i).sort((a,b)=>Number(!!preferred[b])-Number(!!preferred[a])||density(anchors[b])-density(anchors[a])||sizes[b].width*sizes[b].height-sizes[a].width*sizes[a].height),occupied=[],placements=[];
 const overlap=r=>occupied.reduce((n,c)=>n+Math.max(0,Math.min(c.x+c.width+gap,r.x+r.width)-Math.max(c.x-gap,r.x))*Math.max(0,Math.min(c.y+c.height+gap,r.y+r.height)-Math.max(c.y-gap,r.y)),0);
 for(const i of order){const a=anchors[i],s=sizes[i],p=preferred[i];let available=candidates(a,s,p,clearance);if(!available.length)available=candidates(a,s,p,0);if(!available.length)available=[clampRect(preferredCenter(a,s),s)];const target=p||preferredCenter(a,s);available.sort((a,b)=>overlap(a)-overlap(b)||distance(a,target)-distance(b,target));placements[i]=available[0];occupied.push(available[0]);}return placements;
}
