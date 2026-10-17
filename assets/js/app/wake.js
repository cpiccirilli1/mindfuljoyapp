// Keeps the screen awake while a timer runs (Screen Wake Lock).
// Part of the Mindful Joy timer page (index.html). Plain script, not a module:
// the files in assets/js/app/ share one scope, so load order in index.html matters.

// ---------- Keep screen awake during sessions ----------
let wakeLock = null, wakeWanted = false;
async function acquireWake(){
  wakeWanted = true;
  try{
    if('wakeLock' in navigator && !wakeLock){
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', ()=>{ wakeLock = null; });
    }
  }catch(e){ wakeLock = null; }
}
function releaseWake(){
  wakeWanted = false;
  try{ if(wakeLock){ wakeLock.release(); } }catch(e){}
  wakeLock = null;
}
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState === 'visible'){
    if(wakeWanted) acquireWake();
    if(audioCtx && audioCtx.state === 'suspended'){ audioCtx.resume(); }
  }
});
