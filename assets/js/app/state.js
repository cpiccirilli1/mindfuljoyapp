// Shared settings. An imported variable can't be reassigned by the module that imports it,
// so these are objects: modules change their properties (settings.volume = 0.5) instead.

// What Bell Settings has chosen. Read by the audio and timer code, written by the settings panel.
export const settings = {
  startEnabled: true, endEnabled: true, intervalEnabled: false, mode: 'regular',
  prepSeconds: 5, bellSound: 'bowl', startCount: 1, endCount: 1,
  segEnabled: true, segCount: 1, volume: 1, vibrate: false,
  breathSound: true   // soft tones for the breathing pacer (separate from the bells)
};

// ready becomes true once saved settings have been loaded. Until then, changing a control
// should not play a preview bell or overwrite what is saved.
export const store = { ready: false };
