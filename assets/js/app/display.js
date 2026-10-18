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

// A ring is an SVG circle. Prepare it once, then fill it with setRing(el, 0..1).
export function initRing(el){ el.style.strokeDasharray = CIRC; }
export function setRing(el, fraction){ el.style.strokeDashoffset = CIRC * (1 - fraction); }

// The main timer's ring.
const mainRing = $('ringProgress');
initRing(mainRing);
export function updateRing(remaining, total){
  setRing(mainRing, total ? remaining/total : 0);
}
