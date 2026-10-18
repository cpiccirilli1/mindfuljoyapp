// Bell Settings panel: open/close, bell choice, volume, bell counts, vibrate, and the start/end/segment switches.
// (Interval bell controls are in intervals.js.)
import { $ } from './dom.js';
import { settings, store } from './state.js';
import { BELL_OPTIONS, VIBRATE_OK, playSound, stopBells } from './audio.js';

const settingsBtn = $('settingsBtn');
const closeBtn = $('closeBtn');
const panel = $('panel');
const backdrop = $('backdrop');

export const isPanelOpen = () => panel.classList.contains('open');
export function openPanel(){ panel.classList.add('open'); backdrop.classList.add('open'); setTimeout(()=>closeBtn.focus(), 50); }
export function closePanel(){
  const wasOpen = isPanelOpen();
  panel.classList.remove('open'); backdrop.classList.remove('open');
  if(wasOpen) settingsBtn.focus();
}
settingsBtn.addEventListener('click', openPanel);
closeBtn.addEventListener('click', closePanel);
backdrop.addEventListener('click', closePanel);

// Play a short sample so the person can hear their choice (not while saved settings are loading).
function preview(){ stopBells(); playSound(settings.bellSound, 1, 0.9); }

const bellSelect = $('bellSelect');
BELL_OPTIONS.forEach(o=>{
  const opt = document.createElement('option');
  opt.value = o.id; opt.textContent = o.name;
  bellSelect.appendChild(opt);
});
bellSelect.addEventListener('change', ()=>{ settings.bellSound = bellSelect.value; if(store.ready) preview(); });

const volumeRange = $('volumeRange');
const volumeLabel = $('volumeLabel');
volumeRange.addEventListener('input', ()=>{
  settings.volume = Number(volumeRange.value)/100;
  volumeLabel.textContent = volumeRange.value + '%';
});
volumeRange.addEventListener('change', ()=>{ if(store.ready) preview(); });
$('previewBtn').addEventListener('click', preview);

// "How many bells" menus for start, end and segment changes
['startCount','endCount','segCount'].forEach(id=>{
  const sel = $(id);
  for(let n=1;n<=5;n++){
    const opt = document.createElement('option');
    opt.value = n; opt.textContent = n + (n===1?' bell':' bells');
    sel.appendChild(opt);
  }
  sel.addEventListener('change', ()=>{ settings[id] = Number(sel.value); });
});

// On/off switches. Turning one off dims its options.
[['startEnabled','startBody'],['endEnabled','endBody'],['segEnabled','segBody']].forEach(([id, bodyId])=>{
  $(id).addEventListener('change', e=>{
    settings[id] = e.target.checked;
    $(bodyId).classList.toggle('sub-disabled', !e.target.checked);
  });
});

const vibrateBox = $('vibrateEnabled');
if(!VIBRATE_OK){
  vibrateBox.disabled = true;
  $('vibrateNote').textContent = 'Unavailable here: this browser or device does not support vibration. It works on most Android phones.';
}
vibrateBox.addEventListener('change', e=>{
  settings.vibrate = e.target.checked && VIBRATE_OK;
  // A short buzz confirms it works, but only when the person flips the switch (not when saved settings load).
  if(settings.vibrate && e.isTrusted){ try{ navigator.vibrate(120); }catch(err){} }
});
