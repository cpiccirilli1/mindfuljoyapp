(function(){
  // ---------- Duration select ----------
  const durationSelect = document.getElementById('durationSelect');
  for(let m=5; m<=60; m+=5){
    const opt = document.createElement('option');
    opt.value = m; opt.textContent = m + ' min';
    if(m===20) opt.selected = true;
    durationSelect.appendChild(opt);
  }
  [['sequence','Sit + walk'],['custom','Custom length'],['open','Open-ended (count up)']].forEach(([v,t])=>{
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = t;
    durationSelect.appendChild(opt);
  });
  const customLenRow = document.getElementById('customLenRow');
  const customLenInput = document.getElementById('customLenInput');
  const openNote = document.getElementById('openNote');
  const intervalEvery = document.getElementById('intervalEvery');
  for(let m=1; m<=30; m++){
    const opt = document.createElement('option');
    opt.value = m; opt.textContent = m + (m===1?' minute':' minutes');
    if(m===5) opt.selected = true;
    intervalEvery.appendChild(opt);
  }

  // ---------- State ----------
  let totalSeconds = Number(durationSelect.value) * 60;
  let phase = 'idle'; // idle | prep | session
  let phaseTotal = totalSeconds;
  let phaseStartTimestamp = null;
  let phasePausedElapsed = 0;
  let isRunning = false;
  let tickHandle = null;
  let triggered = new Set();
  let customTimes = []; // minutes
  let openEnded = false;
  let storeReady = false; // true once saved settings have been loaded

  const settings = { startEnabled:true, endEnabled:true, intervalEnabled:false, mode:'regular', prepSeconds:5, bellSound:'bowl', startCount:1, endCount:1, segEnabled:true, segCount:1, volume:1 };
  document.getElementById('prepSelect').addEventListener('change', e=>{ settings.prepSeconds = Number(e.target.value); });

  // ---------- DOM ----------
  const timeDisplay = document.getElementById('timeDisplay');
  const phaseLabel = document.getElementById('phaseLabel');
  const playBtn = document.getElementById('playBtn');
  const resetBtn = document.getElementById('resetBtn');
  const ring = document.getElementById('ringProgress');
  const CIRC = 2 * Math.PI * 100;
  ring.style.strokeDasharray = CIRC;

  function fmt(s){
    s = Math.max(0, Math.round(s));
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
    const mm = String(m).padStart(2,'0'), ss = String(sec).padStart(2,'0');
    return h > 0 ? h + ':' + mm + ':' + ss : mm + ':' + ss;
  }
  const announcer = document.getElementById('announcer');
  function announce(msg){ announcer.textContent = ''; setTimeout(()=>{ announcer.textContent = msg; }, 60); }

  function updateRing(remaining, total){
    const frac = total ? remaining/total : 0;
    ring.style.strokeDashoffset = CIRC * (1 - frac);
  }

  function render(remaining){
    timeDisplay.textContent = fmt(remaining);
    updateRing(remaining, phaseTotal);
  }

  function renderPrep(remaining){
    timeDisplay.textContent = fmt(remaining);
    updateRing(remaining, phaseTotal);
  }

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

  // ---------- Audio ----------
  let audioCtx = null;
  function ensureAudio(){
    if(!audioCtx){ audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
    if(audioCtx.state === 'suspended'){ audioCtx.resume(); }
  }
  // Real bell recordings (CC0), loaded from assets/audio/. See assets/audio/CREDITS.txt.
  const SOUND_FILES = { bowl:'assets/audio/bowl.mp3', burma:'assets/audio/burma.mp3', singing:'assets/audio/singing.mp3', gong:'assets/audio/gong.mp3', interval:'assets/audio/interval.mp3' };
  const BELL_OPTIONS = [
    { id:'bowl',    name:'Singing Bowl' },
    { id:'burma',   name:'Burmese Bell' },
    { id:'singing', name:'Singing Bell' },
    { id:'gong',    name:'Zen Gong' }
  ];
  const BELL_GAP = 4;          // seconds between strikes when several bells are set
  const INTERVAL_GAIN = 0.8;
  const buffers = {};          // id -> Promise<AudioBuffer|null>
  let activeSources = [];

  function ensureCtx(){
    if(!audioCtx){ audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
    return audioCtx;
  }
  function decodeBuf(ctx, arr){
    return new Promise((res, rej)=>{
      const p = ctx.decodeAudioData(arr, res, rej);
      if(p && p.catch) p.catch(rej);
    });
  }
  function loadSounds(){
    try{ ensureCtx(); }catch(e){ return; }
    Object.keys(SOUND_FILES).forEach(id=>{
      if(buffers[id]) return;
      buffers[id] = fetch(SOUND_FILES[id])
        .then(r=>{ if(!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
        .then(ab=>decodeBuf(audioCtx, ab))
        .catch(()=>null);
    });
  }

  // Synthesized fallback, only used if a recording fails to decode.
  function synthChime(freq, dur){
    ensureAudio();
    const ctx = audioCtx, now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.connect(ctx.destination);
    [1, 2.01, 2.76, 4.18].forEach((mult,i)=>{
      const osc = ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = freq * mult;
      const g = ctx.createGain(); g.gain.value = [1,0.46,0.26,0.12][i];
      osc.connect(g).connect(master);
      osc.start(now); osc.stop(now + dur + 0.4);
    });
    master.gain.exponentialRampToValueAtTime(0.5, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  }

  function playSound(id, count, gain){
    ensureAudio();
    const ctx = audioCtx;
    const p = buffers[id] || Promise.resolve(null);
    p.then(buf=>{
      if(!buf){ synthChime(id==='interval' ? 880 : 392, 3); return; }
      const t0 = ctx.currentTime + 0.03;
      for(let i=0;i<count;i++){
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain(); g.gain.value = gain * settings.volume;
        src.connect(g).connect(ctx.destination);
        src.start(t0 + i*BELL_GAP);
        activeSources.push(src);
        src.onended = ()=>{ activeSources = activeSources.filter(x=>x!==src); };
      }
    });
  }
  function stopBells(){
    activeSources.forEach(s=>{ try{ s.stop(); }catch(e){} });
    activeSources = [];
  }

  // kind: 'start' | 'end' | 'segment' use the chosen bell (count strikes); 'interval' is always the fixed higher bell.
  function chime(kind, count){
    if(kind === 'interval') playSound('interval', 1, INTERVAL_GAIN);
    else playSound(settings.bellSound, count || 1, 0.9);
  }
  function playBell(kind){
    if(kind==='start' && !settings.startEnabled) return;
    if(kind==='end' && !settings.endEnabled) return;
    if(kind==='interval' && !settings.intervalEnabled) return;
    if(kind==='segment' && !settings.segEnabled) return;
    chime(kind, kind==='start' ? settings.startCount : kind==='end' ? settings.endCount : kind==='segment' ? settings.segCount : 1);
  }
  loadSounds();

  // ---------- Interval schedule ----------
  function triggerPoints(){
    const pts = [];
    if(!settings.intervalEnabled) return pts;
    if(settings.mode === 'regular'){
      const step = Number(intervalEvery.value) * 60;
      const limit = openEnded ? 21600 : totalSeconds;
      for(let t=step; t<limit; t+=step) pts.push(t);
    } else {
      customTimes.forEach(m=>{
        const t = m*60;
        if(t>0 && (openEnded || t<totalSeconds)) pts.push(t);
      });
    }
    return pts.sort((a,b)=>a-b);
  }

  // ---------- Sit / walk sequence (segments) ----------
  const SEG_NAMES = { sit:'Sitting', walk:'Walking' };
  const MAX_SEGMENTS = 12, MAX_SEG_MIN = 120;
  let segments = [{type:'sit',minutes:20},{type:'walk',minutes:10},{type:'sit',minutes:20}];
  let lastSeg = 0;   // index of the segment the timer is currently in
  const isSeq = () => durationSelect.value === 'sequence';
  function cleanSegments(list){
    if(!Array.isArray(list)) return null;
    const out = list.slice(0, MAX_SEGMENTS).map(x=>({
      type: x && x.type === 'walk' ? 'walk' : 'sit',
      minutes: Math.min(MAX_SEG_MIN, Math.max(1, Math.round(Number(x && x.minutes)) || 1))
    }));
    return out.length ? out : null;
  }
  function seqTotalSeconds(){ return segments.reduce((t,sg)=> t + sg.minutes*60, 0); }
  // Cumulative end time (in seconds) of each segment.
  function segEnds(){ let t = 0; return segments.map(sg=> (t += sg.minutes*60)); }
  function segIndexAt(elapsed){
    const ends = segEnds();
    for(let i=0;i<ends.length;i++){ if(elapsed < ends[i]) return i; }
    return ends.length - 1;
  }
  function spokenSeg(i){ const m = segments[i].minutes; return SEG_NAMES[segments[i].type] + ', ' + m + (m===1 ? ' minute' : ' minutes'); }
  function segLabel(i){ return SEG_NAMES[segments[i].type] + ' \u00b7 ' + (i+1) + ' of ' + segments.length; }
  function sessionLabel(elapsed){ return isSeq() ? segLabel(segIndexAt(elapsed || 0)) : 'Sitting'; }
  function seqSummary(){
    return segments.map(sg=> (sg.type==='walk' ? 'Walk ' : 'Sit ') + sg.minutes).join(' \u00b7 ');
  }
  const segStatus = document.getElementById('segStatus');
  // Sequence display: big clock and ring show the current segment; the line
  // under the ring shows what is next and the total time left.
  function renderSeq(elapsed){
    const ends = segEnds();
    const i = segIndexAt(elapsed);
    const start = i ? ends[i-1] : 0;
    const segTotal = ends[i] - start;
    const segRemaining = Math.max(0, ends[i] - elapsed);
    timeDisplay.textContent = fmt(segRemaining);
    updateRing(segRemaining, segTotal);
    phaseLabel.textContent = segLabel(i);
    const totalLeft = Math.max(0, ends[ends.length-1] - elapsed);
    const next = i < segments.length-1
      ? 'Next: ' + SEG_NAMES[segments[i+1].type] + ' (' + segments[i+1].minutes + ' min)'
      : 'Last segment';
    segStatus.textContent = next + ' \u00b7 Total left ' + fmt(totalLeft);
  }
  function renderSeqIdle(){
    segStatus.textContent = seqSummary() + ' \u00b7 ' + Math.round(seqTotalSeconds()/60) + ' min total';
  }

  // ---------- Timer control ----------
  function readLength(){
    const v = durationSelect.value;
    if(v === 'open'){ openEnded = true; totalSeconds = 0; return; }
    openEnded = false;
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
    if(openEnded){ timeDisplay.textContent = '00:00'; ring.style.strokeDashoffset = CIRC; }
    else render(totalSeconds);
    if(isSeq()) renderSeqIdle();
  }
  function renderSession(elapsed){
    if(openEnded){
      timeDisplay.textContent = fmt(elapsed);
      ring.style.strokeDashoffset = CIRC * (1 - ((elapsed % 60) / 60));
    } else if(isSeq()){
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
    if(phase === 'session' && openEnded){
      renderSession(elapsed);
      triggerPoints().forEach(pt=>{
        if(!triggered.has(pt) && elapsed >= pt){
          triggered.add(pt);
          playBell('interval');
          announce('Interval bell');
        }
      });
      return;
    }
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
    phaseTotal = openEnded ? Infinity : totalSeconds;
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
        phaseTotal = openEnded ? Infinity : totalSeconds;
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
    openNote.hidden = durationSelect.value !== 'open';
    seqEditor.hidden = !isSeq();
    segStatus.hidden = !isSeq();
  }
  durationSelect.addEventListener('change', ()=>{ syncLengthUI(); if(phase==='idle') setDuration(); });
  ['input','change'].forEach(t=> customLenInput.addEventListener(t, ()=>{ if(phase==='idle' && durationSelect.value==='custom') setDuration(); }));
  intervalEvery.addEventListener('change', ()=>{ triggered.clear(); });

  render(totalSeconds);

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

  document.getElementById('segEnabled').addEventListener('change', e=>{
    settings.segEnabled = e.target.checked;
    document.getElementById('segBody').classList.toggle('sub-disabled', !e.target.checked);
  });

  const intervalBody = document.getElementById('intervalBody');
  document.getElementById('intervalEnabled').addEventListener('change', e=>{
    settings.intervalEnabled = e.target.checked;
    intervalBody.classList.toggle('sub-disabled', !e.target.checked);
    triggered.clear();
  });

  const modeRegularBtn = document.getElementById('modeRegularBtn');
  const modeCustomBtn = document.getElementById('modeCustomBtn');
  const regularFields = document.getElementById('regularFields');
  const customFields = document.getElementById('customFields');
  function setMode(mode){
    settings.mode = mode;
    modeRegularBtn.classList.toggle('active', mode==='regular');
    modeCustomBtn.classList.toggle('active', mode==='custom');
    regularFields.style.display = mode==='regular' ? '' : 'none';
    customFields.style.display = mode==='custom' ? '' : 'none';
    triggered.clear();
  }
  modeRegularBtn.addEventListener('click', ()=>setMode('regular'));
  modeCustomBtn.addEventListener('click', ()=>setMode('custom'));

  const customChips = document.getElementById('customChips');
  const customMinuteInput = document.getElementById('customMinuteInput');
  function renderChips(){
    customChips.innerHTML = '';
    if(customTimes.length===0){
      const p = document.createElement('div');
      p.className = 'empty-note';
      p.textContent = 'No custom times added yet.';
      customChips.appendChild(p);
      return;
    }
    customTimes.slice().sort((a,b)=>a-b).forEach(m=>{
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.innerHTML = '<span>' + m + ' min</span>';
      const rm = document.createElement('button');
      rm.textContent = '\u00d7';
      rm.setAttribute('aria-label','Remove ' + m + ' minute bell');
      rm.addEventListener('click', ()=>{
        customTimes = customTimes.filter(x=>x!==m);
        renderChips();
        triggered.clear();
      });
      chip.appendChild(rm);
      customChips.appendChild(chip);
    });
  }
  document.getElementById('addCustomBtn').addEventListener('click', ()=>{
    const v = Math.round(Number(customMinuteInput.value));
    if(!v || v<1 || v>59) return;
    if(!customTimes.includes(v)) customTimes.push(v);
    customMinuteInput.value = '';
    renderChips();
    triggered.clear();
  });
  renderChips();

  // ---------- Tabs ----------
  const tabBtns = { timer: document.getElementById('tabBtnTimer'), breathe: document.getElementById('tabBtnBreathe'), reflect: document.getElementById('tabBtnReflect') };
  const tabPanels = { timer: document.getElementById('panel-timer'), breathe: document.getElementById('panel-breathe'), reflect: document.getElementById('panel-reflect') };
  function showTab(name){
    Object.keys(tabPanels).forEach(k=>{
      tabPanels[k].classList.toggle('active', k===name);
      tabBtns[k].classList.toggle('active', k===name);
      tabBtns[k].setAttribute('aria-pressed', String(k===name));
    });
    if(name !== 'breathe') stopBreathing();
  }
  Object.keys(tabBtns).forEach(k=> tabBtns[k].addEventListener('click', ()=>showTab(k)));

  // ---------- Breathing pacer ----------
  const PATTERNS = {
    box:      [['Inhale',4],['Hold',4],['Exhale',4],['Hold',4]],
    '478':    [['Inhale',4],['Hold',7],['Exhale',8]],
    coherent: [['Inhale',5],['Exhale',5]]
  };
  const breathCircle = document.getElementById('breathCircle');
  const breathLabel = document.getElementById('breathLabel');
  const breathCycleCount = document.getElementById('breathCycleCount');
  const breathPlayBtn = document.getElementById('breathPlayBtn');
  const patternSelect = document.getElementById('patternSelect');
  const cyclesSelect = document.getElementById('cyclesSelect');
  let breathTimer = null, breathRunning = false, breathStepIdx = 0, breathCycle = 1;

  function setCircleSize(phaseName){
    breathCircle.style.width = (phaseName==='Inhale' || phaseName==='Hold') ? '72%' : '46%';
    breathCircle.style.height = (phaseName==='Inhale' || phaseName==='Hold') ? '72%' : '46%';
  }
  function softChime(){ chime('interval'); }

  function breathStep(){
    const steps = PATTERNS[patternSelect.value];
    const totalCycles = Number(cyclesSelect.value);
    if(breathStepIdx >= steps.length){ breathStepIdx = 0; breathCycle++; }
    if(breathCycle > totalCycles){ stopBreathing(); breathLabel.textContent='Complete'; breathCircle.style.width='46%'; breathCircle.style.height='46%'; chime('end'); return; }
    const [name, secs] = steps[breathStepIdx];
    breathLabel.textContent = name;
    breathCycleCount.textContent = 'Cycle ' + breathCycle + ' of ' + totalCycles;
    setCircleSize(name);
    softChime();
    breathStepIdx++;
    breathTimer = setTimeout(breathStep, secs*1000);
  }
  function startBreathing(){
    ensureAudio();
    acquireWake();
    breathRunning = true; breathStepIdx = 0; breathCycle = 1;
    patternSelect.disabled = true; cyclesSelect.disabled = true;
    breathPlayBtn.innerHTML = '&#10074;&#10074;';
    breathStep();
  }
  function stopBreathing(){
    if(!isRunning) releaseWake();
    breathRunning = false;
    if(breathTimer){ clearTimeout(breathTimer); breathTimer = null; }
    patternSelect.disabled = false; cyclesSelect.disabled = false;
    breathPlayBtn.innerHTML = '&#9654;';
    breathLabel.textContent = 'Ready';
    breathCycleCount.textContent = '';
    breathCircle.style.width = '46%'; breathCircle.style.height = '46%';
  }
  breathPlayBtn.addEventListener('click', ()=>{ breathRunning ? stopBreathing() : startBreathing(); });
  patternSelect.addEventListener('change', ()=>{ if(!breathRunning){ breathStepIdx=0; breathCycle=1; } });

  // ---------- Reflection prompts ----------
  const PROMPTS = [
    'What feeling is most present in your body right now?',
    'What are you carrying today that you could set down?',
    'What would it feel like to be fully at ease right now?',
    'What is one thing you are grateful for in this moment?',
    'Where in your body do you feel the most tension?',
    'What would you tell a friend who felt the way you do now?',
    'What does your breath want to tell you today?',
    'What is one small kindness you could offer yourself?',
    'What are you avoiding sitting with right now?',
    'What does stillness feel like for you today?',
    'What is one thought you can let pass without following it?',
    'What intention would you like to carry into the rest of your day?'
  ];
  let lastPrompt = -1;
  const reflectText = document.getElementById('reflectText');
  document.getElementById('reflectBtn').addEventListener('click', ()=>{
    let idx;
    do { idx = Math.floor(Math.random()*PROMPTS.length); } while(idx===lastPrompt && PROMPTS.length>1);
    lastPrompt = idx;
    reflectText.textContent = PROMPTS[idx];
  });

  // ---------- Color schemes ----------
  const SCHEMES = window.MJ.SCHEMES;
  const applyScheme = window.MJ.applyScheme;

  const schemeSelect = document.getElementById('schemeSelect');
  window.MJ.fillSelect(schemeSelect, 'sage');
  schemeSelect.addEventListener('change', ()=>{
    const s = SCHEMES.find(x=>x.id===schemeSelect.value);
    if(s) applyScheme(s);
  });
  applyScheme(SCHEMES.find(x=>x.id==='sage'));

  // ---------- Theme gear menu ----------
  const themeBtn = document.getElementById('themeBtn');
  const themePop = document.getElementById('themePop');
  const themeMenu = document.getElementById('themeMenu');
  function openThemeMenu(){ themePop.hidden = false; themeBtn.setAttribute('aria-expanded','true'); }
  function closeThemeMenu(returnFocus){
    const wasOpen = !themePop.hidden;
    themePop.hidden = true; themeBtn.setAttribute('aria-expanded','false');
    if(wasOpen && returnFocus) themeBtn.focus();
  }
  themeBtn.addEventListener('click', ()=>{ themePop.hidden ? openThemeMenu() : closeThemeMenu(false); });
  document.addEventListener('click', e=>{ if(!themePop.hidden && !themeMenu.contains(e.target)) closeThemeMenu(false); });
  schemeSelect.addEventListener('change', ()=>{ if(storeReady) closeThemeMenu(true); });

  // ---------- Sequence editor ----------
  const segList = document.getElementById('segList');
  const seqTotal = document.getElementById('seqTotal');
  const seqMsg = document.getElementById('seqMsg');
  const LAYOUT_KEY = 'still.layouts.v1';
  function say(msg){ seqMsg.textContent = msg; announce(msg); }
  function segmentsChanged(){
    renderSegments();
    if(phase === 'idle' && isSeq()) setDuration();
  }
  function renderSegments(){
    segList.innerHTML = '';
    segments.forEach((sg, i)=>{
      const li = document.createElement('li');
      li.className = 'seg-row';
      li.dataset.i = i;
      const num = document.createElement('span');
      num.className = 'seg-num'; num.textContent = i + 1;
      const type = document.createElement('select');
      type.className = 'seg-type'; type.setAttribute('aria-label', 'Segment ' + (i+1) + ' type');
      [['sit','Sit'],['walk','Walk']].forEach(([v,t])=>{
        const o = document.createElement('option'); o.value = v; o.textContent = t;
        if(sg.type === v) o.selected = true;
        type.appendChild(o);
      });
      const mins = document.createElement('input');
      mins.type = 'number'; mins.className = 'num-input seg-min'; mins.min = 1; mins.max = MAX_SEG_MIN;
      mins.value = sg.minutes; mins.inputMode = 'numeric';
      mins.setAttribute('aria-label', 'Segment ' + (i+1) + ' minutes');
      const unit = document.createElement('span');
      unit.className = 'seg-unit'; unit.textContent = 'min';
      const mk = (cls, label, html, disabled)=>{
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'seg-btn ' + cls; b.setAttribute('aria-label', label + ' segment ' + (i+1));
        b.innerHTML = html; b.disabled = !!disabled;
        return b;
      };
      li.append(num, type, mins, unit,
        mk('seg-up', 'Move up', '&#9650;', i === 0),
        mk('seg-down', 'Move down', '&#9660;', i === segments.length-1),
        mk('seg-remove', 'Remove', '&times;', segments.length === 1));
      segList.appendChild(li);
    });
    seqTotal.textContent = Math.round(seqTotalSeconds()/60) + ' min total';
    document.getElementById('addSitBtn').disabled = document.getElementById('addWalkBtn').disabled = segments.length >= MAX_SEGMENTS;
  }
  // Typing or choosing a value updates the data in place. The list is only
  // redrawn for structural changes (move, add, remove, preset, load), so the
  // field you are in never gets replaced while you use it.
  function segValuesChanged(){
    seqTotal.textContent = Math.round(seqTotalSeconds()/60) + ' min total';
    if(phase === 'idle' && isSeq()) setDuration();
  }
  segList.addEventListener('change', e=>{
    const li = e.target.closest('.seg-row'); if(!li) return;
    const sg = segments[Number(li.dataset.i)];
    if(e.target.classList.contains('seg-type')) sg.type = e.target.value === 'walk' ? 'walk' : 'sit';
    if(e.target.classList.contains('seg-min')){
      sg.minutes = Math.min(MAX_SEG_MIN, Math.max(1, Math.round(Number(e.target.value)) || 1));
      e.target.value = sg.minutes;
    }
    segValuesChanged();
  });
  segList.addEventListener('input', e=>{
    if(!e.target.classList.contains('seg-min')) return;
    const v = Math.round(Number(e.target.value));
    if(v >= 1 && v <= MAX_SEG_MIN){
      segments[Number(e.target.closest('.seg-row').dataset.i)].minutes = v;
      segValuesChanged();
    }
  });
  segList.addEventListener('click', e=>{
    const b = e.target.closest('.seg-btn'); if(!b) return;
    const i = Number(b.closest('.seg-row').dataset.i);
    if(b.classList.contains('seg-remove') && segments.length > 1) segments.splice(i, 1);
    else if(b.classList.contains('seg-up') && i > 0) [segments[i-1], segments[i]] = [segments[i], segments[i-1]];
    else if(b.classList.contains('seg-down') && i < segments.length-1) [segments[i+1], segments[i]] = [segments[i], segments[i+1]];
    else return;
    segmentsChanged();
    // keep keyboard focus on the same kind of control after the list re-renders
    const row = segList.children[b.classList.contains('seg-remove') ? Math.min(i, segments.length-1) : (b.classList.contains('seg-up') ? i-1 : i+1)];
    const again = row && row.querySelector(b.classList.contains('seg-remove') ? '.seg-remove' : b.classList.contains('seg-up') ? '.seg-up' : '.seg-down');
    if(again && !again.disabled) again.focus(); else if(row) row.querySelector('.seg-type').focus();
  });
  function addSeg(type){
    if(segments.length >= MAX_SEGMENTS) return;
    segments.push({type, minutes: type === 'walk' ? 10 : 20});
    segmentsChanged();
  }
  document.getElementById('addSitBtn').addEventListener('click', ()=>addSeg('sit'));
  document.getElementById('addWalkBtn').addEventListener('click', ()=>addSeg('walk'));

  const PRESETS = {
    'sit-walk-sit': [['sit',20],['walk',10],['sit',20]],
    'sit-walk': [['sit',20],['walk',10]],
    'walk-sit': [['walk',10],['sit',20]],
    'rounds': [['sit',10],['walk',5],['sit',10],['walk',5]]
  };
  const presetSelect = document.getElementById('presetSelect');
  presetSelect.addEventListener('change', ()=>{
    const p = PRESETS[presetSelect.value];
    if(!p) return;
    segments = p.map(([type,minutes])=>({type, minutes}));
    presetSelect.value = '';
    segmentsChanged();
    say('Preset applied: ' + seqSummary());
  });

  // Saved sequences (on this device only)
  const layoutName = document.getElementById('layoutName');
  const layoutSelect = document.getElementById('layoutSelect');
  const savedBlock = document.getElementById('savedBlock');
  function readLayouts(){
    try{
      const d = JSON.parse(localStorage.getItem(LAYOUT_KEY) || '[]');
      return Array.isArray(d) ? d.filter(x=> x && typeof x.name === 'string' && cleanSegments(x.segments)) : [];
    }catch(e){ return []; }
  }
  function writeLayouts(list){
    try{ localStorage.setItem(LAYOUT_KEY, JSON.stringify(list)); return true; }catch(e){ return false; }
  }
  function renderLayouts(selectName){
    const list = readLayouts();
    layoutSelect.innerHTML = '';
    list.forEach(l=>{
      const o = document.createElement('option'); o.value = l.name; o.textContent = l.name;
      if(l.name === selectName) o.selected = true;
      layoutSelect.appendChild(o);
    });
    savedBlock.hidden = list.length === 0;
  }
  document.getElementById('saveLayoutBtn').addEventListener('click', ()=>{
    const name = layoutName.value.trim().slice(0, 30);
    if(!name){ say('Type a name first.'); layoutName.focus(); return; }
    const list = readLayouts().filter(l=> l.name !== name);
    list.push({ name, segments: segments.map(sg=>({type:sg.type, minutes:sg.minutes})) });
    if(list.length > 20) list.shift();
    if(!writeLayouts(list)){ say('Could not save on this device.'); return; }
    layoutName.value = '';
    renderLayouts(name);
    say('Saved "' + name + '".');
  });
  document.getElementById('loadLayoutBtn').addEventListener('click', ()=>{
    const l = readLayouts().find(x=> x.name === layoutSelect.value);
    if(!l) return;
    segments = cleanSegments(l.segments);
    segmentsChanged();
    say('Loaded "' + l.name + '": ' + seqSummary());
  });
  document.getElementById('deleteLayoutBtn').addEventListener('click', ()=>{
    const name = layoutSelect.value; if(!name) return;
    writeLayouts(readLayouts().filter(x=> x.name !== name));
    renderLayouts();
    say('Deleted "' + name + '".');
  });
  renderSegments();
  renderLayouts();

  // ---------- Keyboard shortcuts ----------
  document.addEventListener('keydown', e=>{
    if(e.ctrlKey || e.metaKey || e.altKey) return;
    if(e.key === 'Escape'){
      if(!themePop.hidden) closeThemeMenu(true);
      else if(panel.classList.contains('open')) closePanel();
      return;
    }
    const t = e.target, tag = t && t.tagName;
    if(tag==='INPUT' || tag==='SELECT' || tag==='TEXTAREA' || tag==='BUTTON' || tag==='A' || (t && t.isContentEditable)) return;
    if(panel.classList.contains('open') || document.body.classList.contains('info-open')) return;
    if(!tabPanels.timer.classList.contains('active')) return;
    if(e.key === ' ' || e.code === 'Space'){ e.preventDefault(); isRunning ? pause() : play(); }
    else if(e.key === 'r' || e.key === 'R'){ reset(); }
    else if(e.key === 'b' || e.key === 'B'){ openPanel(); }
  });

  // ---------- Remember settings (on this device only) ----------
  const STORE_KEY = 'still.settings.v1';
  const $ = id => document.getElementById(id);
  function saveSettings(){
    if(!storeReady) return;
    try{
      localStorage.setItem(STORE_KEY, JSON.stringify({
        scheme: schemeSelect.value, duration: durationSelect.value, customLen: customLenInput.value,
        bell: bellSelect.value, volume: volumeRange.value,
        startEnabled: $('startEnabled').checked, startCount: $('startCount').value,
        endEnabled: $('endEnabled').checked, endCount: $('endCount').value,
        prep: $('prepSelect').value,
        intervalEnabled: $('intervalEnabled').checked, mode: settings.mode,
        intervalEvery: intervalEvery.value, customTimes: customTimes,
        pattern: patternSelect.value, cycles: cyclesSelect.value,
        segEnabled: $('segEnabled').checked, segCount: $('segCount').value, segments: segments
      }));
    }catch(e){}
  }
  function setVal(id, v){
    const e = $(id);
    if(!e || v === undefined || v === null) return;
    if(e.type === 'checkbox'){ e.checked = !!v; }
    else {
      if(e.tagName === 'SELECT' && ![].some.call(e.options, o=> String(o.value) === String(v))) return;
      e.value = v;
    }
    if(e.type === 'range') e.dispatchEvent(new Event('input', {bubbles:true}));
    e.dispatchEvent(new Event('change', {bubbles:true}));
  }
  function loadSettings(){
    let d = null;
    try{ d = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); }catch(e){ d = null; }
    if(d && typeof d === 'object'){
      setVal('schemeSelect', d.scheme);
      setVal('customLenInput', d.customLen);
      setVal('durationSelect', d.duration);
      setVal('bellSelect', d.bell);
      setVal('volumeRange', d.volume);
      setVal('startEnabled', d.startEnabled); setVal('startCount', d.startCount);
      setVal('endEnabled', d.endEnabled); setVal('endCount', d.endCount);
      setVal('prepSelect', d.prep);
      if(Array.isArray(d.customTimes)){
        customTimes = d.customTimes.map(Number).filter(n=> n>=1 && n<=59);
        renderChips();
      }
      if(d.mode === 'regular' || d.mode === 'custom') setMode(d.mode);
      setVal('intervalEvery', d.intervalEvery);
      setVal('intervalEnabled', d.intervalEnabled);
      setVal('patternSelect', d.pattern); setVal('cyclesSelect', d.cycles);
      setVal('segEnabled', d.segEnabled); setVal('segCount', d.segCount);
      const saved = cleanSegments(d.segments);
      if(saved){ segments = saved; renderSegments(); }
    }
    syncLengthUI();
    if(phase === 'idle') setDuration();
    storeReady = true;
  }
  loadSettings();
  ['change','input','click'].forEach(t=> document.addEventListener(t, ()=>{ setTimeout(saveSettings, 0); }));
})();
