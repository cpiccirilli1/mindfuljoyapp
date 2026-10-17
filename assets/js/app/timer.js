// Main meditation timer: length, tick loop, play / pause / reset.
// Part of the Mindful Joy timer page (index.html). Plain script, not a module:
// the files in assets/js/app/ share one scope, so load order in index.html matters.

// ---------- Timer control ----------
function readLength(){
  const v = durationSelect.value;
  if(v === 'sequence'){ totalSeconds = seqTotalSeconds(); return; }
  if(v === 'custom'){
    let m = Math.round(Number(customLenInput.value));
    if(!m || m < 1) m = 1;
    if(m > 240) m = 240;
    totalSeconds = m*60;
  } else {
    totalSeconds = Number(v)*60;
  }
}
function renderIdle(){
  phaseTotal = totalSeconds;
  render(totalSeconds);
  if(isSeq()) renderSeqIdle();
}
function renderSession(elapsed){
  if(isSeq()){
    renderSeq(elapsed);
  } else {
    render(phaseTotal - elapsed);
  }
}
function setDuration(){
  readLength();
  phasePausedElapsed = 0;
  triggered.clear();
  renderIdle();
  phaseLabel.textContent = 'Ready';
}
const seqEditor = document.getElementById('seqEditor');
function setLengthLocked(b){ durationSelect.disabled = b; customLenInput.disabled = b; seqEditor.disabled = b; }

function stopTick(){
  if(tickHandle){ clearInterval(tickHandle); tickHandle = null; }
}

function tick(){
  const elapsed = (Date.now() - phaseStartTimestamp)/1000;
  const remaining = phaseTotal - elapsed;
  if(remaining <= 0){
    if(phase === 'prep'){ beginSession(); return; }
    render(0);
    finish();
    return;
  }
  if(phase === 'prep'){ renderPrep(remaining); }
  else {
    render(remaining);
    if(isSeq()){
      renderSeq(elapsed);
      const idx = segIndexAt(elapsed);
      if(idx > lastSeg){
        lastSeg = idx;
        playBell('segment');
        announce(spokenSeg(idx));
      }
    }
    triggerPoints().forEach(pt=>{
      if(!triggered.has(pt) && elapsed >= pt){
        triggered.add(pt);
        playBell('interval');
        announce('Interval bell');
      }
    });
  }
}

function beginSession(){
  phase = 'session';
  phaseTotal = totalSeconds;
  phasePausedElapsed = 0;
  phaseStartTimestamp = Date.now();
  triggered.clear();
  lastSeg = 0;
  playBell('start');
  phaseLabel.textContent = sessionLabel(0);
  announce(isSeq() ? 'Session started. ' + spokenSeg(0) : 'Session started');
  renderSession(0);
}

function play(){
  pPause(); cuPause(); swPause();
  ensureAudio();
  acquireWake();
  if(phase === 'idle') readLength();
  setLengthLocked(true);
  playBtn.innerHTML = '&#10074;&#10074;';
  playBtn.setAttribute('aria-label','Pause');
  isRunning = true;

  if(phase === 'idle'){
    if(settings.prepSeconds > 0){
      phase = 'prep';
      phaseTotal = settings.prepSeconds;
      phaseLabel.textContent = 'Starting in';
      announce('Starting in ' + settings.prepSeconds + ' seconds');
    } else {
      phase = 'session';
      phaseTotal = totalSeconds;
      triggered.clear();
      lastSeg = 0;
      playBell('start');
      phaseLabel.textContent = sessionLabel(0);
      announce(isSeq() ? 'Session started. ' + spokenSeg(0) : 'Session started');
      renderSession(0);
    }
    phaseStartTimestamp = Date.now();
  } else {
    // resuming from pause, mid-prep or mid-session
    phaseStartTimestamp = Date.now() - phasePausedElapsed*1000;
    phaseLabel.textContent = phase === 'prep' ? 'Starting in' : sessionLabel(phasePausedElapsed);
    announce('Resumed');
  }
  tickHandle = setInterval(tick, 200);
}

function pause(){
  releaseWake();
  isRunning = false;
  phasePausedElapsed = (Date.now() - phaseStartTimestamp)/1000;
  stopTick();
  playBtn.innerHTML = '&#9654;';
  playBtn.setAttribute('aria-label','Resume');
  phaseLabel.textContent = 'Paused';
  announce('Paused');
}

function finish(){
  releaseWake();
  isRunning = false;
  stopTick();
  playBell('end');
  playBtn.innerHTML = '&#9654;';
  playBtn.setAttribute('aria-label','Start');
  phaseLabel.textContent = 'Complete';
  announce('Session complete');
  phase = 'idle';
  phaseTotal = totalSeconds;
  phasePausedElapsed = 0;
  setLengthLocked(false);
  if(isSeq()) renderSeqIdle();
}

function reset(){
  releaseWake();
  stopBells();
  isRunning = false;
  stopTick();
  phase = 'idle';
  phasePausedElapsed = 0;
  triggered.clear();
  lastSeg = 0;
  readLength();
  renderIdle();
  playBtn.innerHTML = '&#9654;';
  playBtn.setAttribute('aria-label','Start');
  phaseLabel.textContent = 'Ready';
  announce('Timer reset');
  setLengthLocked(false);
}

playBtn.addEventListener('click', ()=>{ isRunning ? pause() : play(); });
resetBtn.addEventListener('click', reset);
function syncLengthUI(){
  customLenRow.hidden = durationSelect.value !== 'custom';
  seqEditor.hidden = !isSeq();
  segStatus.hidden = !isSeq();
}
durationSelect.addEventListener('change', ()=>{ syncLengthUI(); if(phase==='idle') setDuration(); });
['input','change'].forEach(t=> customLenInput.addEventListener(t, ()=>{ if(phase==='idle' && durationSelect.value==='custom') setDuration(); }));
intervalEvery.addEventListener('change', ()=>{ triggered.clear(); });

render(totalSeconds);
