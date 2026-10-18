// Sit + walk sequence: the list of segments and how the timer shows the current one.
// (The editor for the list lives in sequence-editor.js.)
import { $ } from './dom.js';
import { fmt, updateRing } from './display.js';

const SEG_NAMES = { sit:'Sitting', walk:'Walking' };
export const MAX_SEGMENTS = 12, MAX_SEG_MIN = 120;

// Shared and changed from several files, so it lives in an object:
//   segments: the list, e.g. [{type:'sit', minutes:20}, ...]
//   lastSeg:  index of the segment the running timer is currently in
export const seq = {
  segments: [{type:'sit',minutes:20},{type:'walk',minutes:10},{type:'sit',minutes:20}],
  lastSeg: 0
};

export const isSeq = () => $('durationSelect').value === 'sequence';

// Make sure a list (from saved data, say) is safe to use. Returns null if it is unusable.
export function cleanSegments(list){
  if(!Array.isArray(list)) return null;
  const out = list.slice(0, MAX_SEGMENTS).map(x=>({
    type: x && x.type === 'walk' ? 'walk' : 'sit',
    minutes: Math.min(MAX_SEG_MIN, Math.max(1, Math.round(Number(x && x.minutes)) || 1))
  }));
  return out.length ? out : null;
}
export function seqTotalSeconds(){ return seq.segments.reduce((t,sg)=> t + sg.minutes*60, 0); }
// Cumulative end time (in seconds) of each segment.
function segEnds(){ let t = 0; return seq.segments.map(sg=> (t += sg.minutes*60)); }
export function segIndexAt(elapsed){
  const ends = segEnds();
  for(let i=0;i<ends.length;i++){ if(elapsed < ends[i]) return i; }
  return ends.length - 1;
}
export function spokenSeg(i){ const m = seq.segments[i].minutes; return SEG_NAMES[seq.segments[i].type] + ', ' + m + (m===1 ? ' minute' : ' minutes'); }
function segLabel(i){ return SEG_NAMES[seq.segments[i].type] + ' · ' + (i+1) + ' of ' + seq.segments.length; }
export function sessionLabel(elapsed){ return isSeq() ? segLabel(segIndexAt(elapsed || 0)) : 'Sitting'; }
export function seqSummary(){
  return seq.segments.map(sg=> (sg.type==='walk' ? 'Walk ' : 'Sit ') + sg.minutes).join(' · ');
}

const segStatus = $('segStatus');
// Sequence display: big clock and ring show the current segment; the line
// under the ring shows what is next and the total time left.
export function renderSeq(elapsed){
  const segments = seq.segments;
  const ends = segEnds();
  const i = segIndexAt(elapsed);
  const start = i ? ends[i-1] : 0;
  const segTotal = ends[i] - start;
  const segRemaining = Math.max(0, ends[i] - elapsed);
  $('timeDisplay').textContent = fmt(segRemaining);
  updateRing(segRemaining, segTotal);
  $('phaseLabel').textContent = segLabel(i);
  const totalLeft = Math.max(0, ends[ends.length-1] - elapsed);
  const next = i < segments.length-1
    ? 'Next: ' + SEG_NAMES[segments[i+1].type] + ' (' + segments[i+1].minutes + ' min)'
    : 'Last segment';
  segStatus.textContent = next + ' · Total left ' + fmt(totalLeft);
}
export function renderSeqIdle(){
  segStatus.textContent = seqSummary() + ' · ' + Math.round(seqTotalSeconds()/60) + ' min total';
}
