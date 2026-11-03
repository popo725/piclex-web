// Native requests landscape for this screen. Mobile browsers that cannot lock
// orientation pause the battle and ask the player to turn their phone instead.
export function mountLandscapePrompt({prompt,pause}) {
  const coarse=matchMedia('(pointer:coarse)');
  const update=()=>{
    const portrait=coarse.matches&&innerWidth<innerHeight;
    if(portrait){pause();if(!prompt.open)prompt.showModal();}
    else if(prompt.open)prompt.close();
  };
  prompt.addEventListener('cancel',event=>event.preventDefault());
  window.addEventListener('resize',update);
  coarse.addEventListener('change',update);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
  update();
}
