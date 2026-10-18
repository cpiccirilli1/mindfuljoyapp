// Keeps the screen awake while a timer runs (Screen Wake Lock, where the browser has it).
let wakeLock = null, wakeWanted = false;

export async function acquireWake(){
  wakeWanted = true;
  try{
    if('wakeLock' in navigator && !wakeLock){
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', ()=>{ wakeLock = null; });
    }
  }catch(e){ wakeLock = null; }
}

export function releaseWake(){
  wakeWanted = false;
  try{ if(wakeLock){ wakeLock.release(); } }catch(e){}
  wakeLock = null;
}

// The browser drops the lock when the tab is hidden; ask for it again when the tab comes back.
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState === 'visible' && wakeWanted) acquireWake();
});
