// Sit + walk sequence: the segment list and how the timer shows the current segment.
// Part of the Mindful Joy timer page (index.html). Plain script, not a module:
// the files in assets/js/app/ share one scope, so load order in index.html matters.

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
