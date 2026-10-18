// A small registry of everything that can "run": the main timer, Pomodoro, Count Up,
// Stopwatch and the breathing pacer. It replaces the old habit of each timer calling
// every other timer's pause function directly, which made every file depend on every other.
//
// A timer registers itself like this:
//   registerActivity('pomodoro', { isRunning: () => pRunning, pause: pPause, more: true });
// `more: true` marks the timers in the "More" menu, which get the green "live" dot while running.
import { $ } from './dom.js';
import { releaseWake } from './wake.js';

const activities = [];

export function registerActivity(name, api){ activities.push({ name, ...api }); }

// Starting one thing stops the rest.
export function pauseOthers(name){
  activities.forEach(a=>{ if(a.name !== name) a.pause(); });
}

function anyRunning(){ return activities.some(a=> a.isRunning()); }

// Let the screen sleep again, but only when nothing is running.
export function maybeRelease(){ if(!anyRunning()) releaseWake(); }

// Show the "live" dot on the More button while a More timer is running.
export function updateLive(){
  $('moreBtn').classList.toggle('live', activities.some(a=> a.more && a.isRunning()));
}
