// Native PracticeExperience.swift constants and four-stage cubic route.
export const symbols=['😀','😎','🥳','🐶','🐱','🐼','🦊','🐸','🍎','🍓','🍉','🍇','🌈','🚀','🎈','⚽'];
export const MAX_PARTICLES=96;
const mix=(a,b,t)=>a+(b-a)*t;
export function cubic([a,b,c,d],t){const q=1-t;return {x:q*q*q*a.x+3*q*q*t*b.x+3*q*t*t*c.x+t*t*t*d.x,y:q*q*q*a.y+3*q*q*t*b.y+3*q*t*t*c.y+t*t*t*d.y};}
export function makeFlight({source,origin,photo,width,leftBound=0,perfect=false,random=Math.random}){
 const left=random()<.5,side=left?-1:1,bend=random(),radius=perfect?mix(3.6,5.2,random()):mix(2.1,3.8,random()),margin=Math.min(7,radius*2)+.45;
 const laneMin=left?leftBound+margin:photo.right+margin,laneMax=left?Math.max(leftBound+margin,photo.left-margin):Math.max(laneMin,width-margin),lane=v=>mix(laneMin,laneMax,v);
 const start={x:source.left+source.width*random(),y:source.bottom+.5},lowerX=lane(mix(.12,.88,random())),travel=Math.abs(lowerX-start.x);
 const jetDepth=(Math.max(origin.bottom+3,start.y+8+mix(6,22,random())*.2)-start.y)*3;
 const jet={x:start.x+side*Math.min(travel*.12,3+bend*9),y:start.y+jetDepth},bottom=Math.max(origin.bottom+margin+1.05,start.y+3);
 const settled={x:start.x+side*Math.min(travel*.36,22+bend*12),y:bottom},lower={x:lowerX,y:bottom-22},upper={x:lane(mix(.12,.88,random())),y:photo.top-mix(6,12,random())};
 const ejection=mix(.09,.14,random()),settling=ejection+.08,departure=mix(.30,.38,random()),capture=mix(.80,.86,random());
 const sd=settling-ejection,bd=departure-settling,ad=capture-departure,handle=Math.min(Math.abs(settled.x-jet.x)*.45,Math.abs(lower.x-settled.x)*.25*sd/bd);
 return {radius,emoji:Math.floor(random()*symbols.length),rotation:mix(-.3,.3,random()),spin:mix(-.6,.6,random()),duration:mix(1250,1850,random()),delay:mix(0,perfect?180:15,random()),stages:[0,ejection,settling,departure,capture],laneMin,laneMax,phase:random()*Math.PI*2,cycles:mix(1,2,random()),amplitude:mix(.75,.98,random()),curves:[
 [start,{x:start.x,y:start.y+jetDepth*.72},{x:jet.x-side*2,y:jet.y-2},jet],
 [jet,{x:jet.x+side*2*sd/ejection,y:jet.y+2*sd/ejection},{x:settled.x-side*handle,y:bottom},settled],
 [settled,{x:settled.x+side*handle*bd/sd,y:bottom},{x:lower.x,y:bottom},lower],
 [lower,{x:lower.x,y:lower.y-22*ad/bd},{x:upper.x,y:upper.y+(lower.y-upper.y)*(.24+(1-bend)*.20)},upper]]};
}
export function flightPoint(p,t,target){if(t>=p.stages[4]){const q=(t-p.stages[4])/(1-p.stages[4]),a=p.curves[3][3],u=.35*q+.65*q*q;return {x:mix(a.x,target.x,u),y:mix(a.y,target.y,u)};}const i=t<p.stages[1]?0:t<p.stages[2]?1:t<p.stages[3]?2:3,q=(t-p.stages[i])/(p.stages[i+1]-p.stages[i]),point=cubic(p.curves[i],q);if(i===3){const x=(p.laneMin+p.laneMax)/2+(p.laneMax-p.laneMin)/2*Math.sin(q*Math.PI*2*p.cycles+p.phase)*p.amplitude,w=Math.sin(q*Math.PI)**2*.95;point.x=mix(point.x,x,w);}return point;}
