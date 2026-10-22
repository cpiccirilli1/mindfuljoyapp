// Entry point for the timer page: index.html loads only this file (as a module).
// Each import below runs that feature's file, which wires up its own part of the page.
// Order matters in one place: storage.js must come last, because it restores saved
// settings by "changing" every control, and the other features must be listening by then.
import './timer.js';           // main meditation timer (also brings in audio, wake lock, sequence, intervals)
import './bell-settings.js';   // Bell Settings panel
import './tabs.js';            // tabs and the More menu (also brings in the breathing pacer)
import './pomodoro.js';
import './countup.js';
import './stopwatch.js';
import './reflect.js';
import './history.js';     // session history and the History page
import './theme-menu.js';
import './sequence-editor.js'; // sit + walk editor
import './shortcuts.js';
import './storage.js';         // keep last
