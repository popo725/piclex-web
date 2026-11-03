// Separate from ordinary toasts: pickups, shop messages and simultaneous unlocks
// cannot replace a medal before the player has time to read it.
export class AchievementNotices {
  constructor(show,hide,play){this.show=show;this.hide=hide;this.play=play;this.reset();}
  reset(){this.queue=[];this.seen=new Set();this.remaining=0;this.hide();}
  enqueue(values){for(const a of values)if(!this.seen.has(a.id)){this.seen.add(a.id);this.queue.push(a);}}
  update(dt,blocked=false){
    if(blocked){this.hide();return;}
    if(this.remaining>0){this.remaining-=Math.min(.1,Math.max(0,dt));if(this.remaining>0){this.show(this.current);return;}this.hide();}
    if(!this.queue.length)return;
    this.current=this.queue.shift();this.remaining=3;this.show(this.current);this.play('achievement');
  }
}
