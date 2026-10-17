// Bell Settings panel: open/close, bell choice, volume, bell counts, vibrate, start/end/segment switches.
// Part of the Mindful Joy timer page (index.html). Plain script, not a module:
// the files in assets/js/app/ share one scope, so load order in index.html matters.

// ---------- Settings panel ----------
const settingsBtn = document.getElementById('settingsBtn');
const closeBtn = document.getElementById('closeBtn');
const panel = document.getElementById('panel');
const backdrop = document.getElementById('backdrop');
function openPanel(){ panel.classList.add('open'); backdrop.classList.add('open'); setTimeout(()=>closeBtn.focus(), 50); }
function closePanel(){
  const wasOpen = panel.classList.contains('open');
  panel.classList.remove('open'); backdrop.classList.remove('open');
  if(wasOpen) settingsBtn.focus();
}
settingsBtn.addEventListener('click', openPanel);
closeBtn.addEventListener('click', closePanel);
backdrop.addEventListener('click', closePanel);

const bellSelect = document.getElementById('bellSelect');
BELL_OPTIONS.forEach(o=>{
  const opt = document.createElement('option');
  opt.value = o.id; opt.textContent = o.name;
  bellSelect.appendChild(opt);
});
bellSelect.addEventListener('change', ()=>{ settings.bellSound = bellSelect.value; if(storeReady){ stopBells(); playSound(settings.bellSound, 1, 0.9); } });
const volumeRange = document.getElementById('volumeRange');
const volumeLabel = document.getElementById('volumeLabel');
volumeRange.addEventListener('input', ()=>{
  settings.volume = Number(volumeRange.value)/100;
  volumeLabel.textContent = volumeRange.value + '%';
});
volumeRange.addEventListener('change', ()=>{ if(storeReady){ stopBells(); playSound(settings.bellSound, 1, 0.9); } });
document.getElementById('previewBtn').addEventListener('click', ()=>{ stopBells(); playSound(settings.bellSound, 1, 0.9); });
[['startCount','startCount'],['endCount','endCount'],['segCount','segCount']].forEach(([id,key])=>{
  const sel = document.getElementById(id);
  for(let n=1;n<=5;n++){
    const opt = document.createElement('option');
    opt.value = n; opt.textContent = n + (n===1?' bell':' bells');
    sel.appendChild(opt);
  }
  sel.addEventListener('change', ()=>{ settings[key] = Number(sel.value); });
});
document.getElementById('startEnabled').addEventListener('change', e=>{
  settings.startEnabled = e.target.checked;
  document.getElementById('startBody').classList.toggle('sub-disabled', !e.target.checked);
});
document.getElementById('endEnabled').addEventListener('change', e=>{
  settings.endEnabled = e.target.checked;
  document.getElementById('endBody').classList.toggle('sub-disabled', !e.target.checked);
});

const vibrateBox = document.getElementById('vibrateEnabled');
if(!VIBRATE_OK){
  vibrateBox.disabled = true;
  document.getElementById('vibrateNote').textContent = 'Unavailable here: this browser or device does not support vibration. It works on most Android phones.';
}
vibrateBox.addEventListener('change', e=>{
  settings.vibrate = e.target.checked && VIBRATE_OK;
  // A short buzz confirms it works, but only when the person flips the switch (not when saved settings load).
  if(settings.vibrate && e.isTrusted){ try{ navigator.vibrate(120); }catch(err){} }
});

document.getElementById('segEnabled').addEventListener('change', e=>{
  settings.segEnabled = e.target.checked;
  document.getElementById('segBody').classList.toggle('sub-disabled', !e.target.checked);
});
