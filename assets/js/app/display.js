// Helpers for showing time: clock text, the progress rings, and the screen-reader announcer.
import { $ } from './dom.js';

// Length of a ring's outline. Every ring on the page is a circle of radius 100.
const CIRC = 2 * Math.PI * 100;

// 75 -> "01:15", 3725 -> "1:02:05"
export function fmt(s){
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  const mm = String(m).padStart(2,'0'), ss = String(sec).padStart(2,'0');
  return h > 0 ? h + ':' + mm + ':' + ss : mm + ':' + ss;
}

// Say something to screen readers (a hidden live region).
const announcer = $('announcer');
export function announce(msg){ announcer.textContent = ''; setTimeout(()=>{ announcer.textContent = msg; }, 60); }

// A ring is an SVG circle. Prepare it once with initRing(el), then fill it with setRing(el, 0..1).
//
// Rainbow rings (the Pride themes): initRing also draws seven colored arcs (red to violet) on top of the
// ring, seen through a "mask" shaped like the progress arc. setRing moves the mask along with the normal
// ring, so the rainbow counts down exactly as the plain ring does. CSS shows the rainbow only while the
// page has the "pride" class and hides it otherwise (see the Pride section of styles.css).
const SVG_NS = 'http://www.w3.org/2000/svg';
const SEGMENTS = 7, SEGMENT_GAP = 5;   // seven arcs with a small gap between each
const maskCircles = new Map();         // progress circle -> the mask circle that mirrors it

function svgEl(name, attrs){
  const e = document.createElementNS(SVG_NS, name);
  Object.keys(attrs).forEach(k=> e.setAttribute(k, attrs[k]));
  return e;
}
function buildRainbow(el){
  const svg = el.ownerSVGElement;
  const maskId = (el.id || 'ring') + '-mask';
  const maskCircle = svgEl('circle', { class:'ring-mask-circle', cx:110, cy:110, r:100 });
  maskCircle.style.strokeDasharray = CIRC;
  const mask = svgEl('mask', { id: maskId });
  mask.appendChild(maskCircle);
  const defs = svgEl('defs', {});
  defs.appendChild(mask);
  svg.appendChild(defs);

  const group = svgEl('g', { class:'rainbow-ring', mask:'url(#' + maskId + ')' });
  const arc = CIRC / SEGMENTS - SEGMENT_GAP;
  for(let i = 0; i < SEGMENTS; i++){
    const c = svgEl('circle', { class:'rb', cx:110, cy:110, r:100 });
    c.style.stroke = 'var(--rb' + i + ')';
    c.style.strokeDasharray = arc + ' ' + (CIRC - arc);
    c.style.strokeDashoffset = -(i * CIRC / SEGMENTS + SEGMENT_GAP / 2);
    group.appendChild(c);
  }
  svg.appendChild(group);
  maskCircles.set(el, maskCircle);
}
export function initRing(el){
  el.style.strokeDasharray = CIRC;
  buildRainbow(el);
}
export function setRing(el, fraction){
  const offset = CIRC * (1 - fraction);
  el.style.strokeDashoffset = offset;
  const m = maskCircles.get(el);
  if(m) m.style.strokeDashoffset = offset;
}

// The main timer's ring.
const mainRing = $('ringProgress');
initRing(mainRing);
export function updateRing(remaining, total){
  setRing(mainRing, total ? remaining/total : 0);
}
