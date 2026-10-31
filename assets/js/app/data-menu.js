// "Your data" section of the gear menu: Export and Import for history (and, if you like, settings).
// Loaded on every page, because the gear menu is on every page. The history itself is in history-store.js.
//
// Nothing is uploaded or downloaded from anywhere: Export makes a file from what is already in this
// browser, and Import reads a file you pick. Importing adds to the history you have and never makes
// duplicates (every session has its own id).
import * as H from './history-store.js';

const pop = document.getElementById('themePop');
if(pop){
  const sec = document.createElement('div');
  sec.className = 'data-sec';
  sec.innerHTML =
    '<p class="data-title">Your data</p>'
    + '<div class="data-row"><button type="button" id="dataExport">Export</button><button type="button" id="dataImport">Import</button></div>'
    + '<label class="data-check"><input type="checkbox" id="dataSettings" checked> Include settings</label>'
    + '<p class="data-note">Saved as a file on this device. Nothing is uploaded. Importing adds to your history and never creates duplicates.</p>'
    + '<p class="data-status" id="dataStatus" role="status"></p>'
    + '<input type="file" id="dataFile" accept=".json,application/json" hidden>';
  pop.appendChild(sec);

  const status = sec.querySelector('#dataStatus');
  const includeSettings = sec.querySelector('#dataSettings');
  const fileInput = sec.querySelector('#dataFile');
  const say = (msg, isError) => { status.textContent = msg; status.classList.toggle('err', !!isError); };
  const plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');

  function readSettings(){
    try{ return JSON.parse(localStorage.getItem(H.SETTINGS_KEY) || 'null'); }catch(e){ return null; }
  }

  // ----- Export: build the file and hand it to the browser as a download -----
  sec.querySelector('#dataExport').addEventListener('click', ()=>{
    const sessions = H.loadSessions();
    const settings = includeSettings.checked ? readSettings() : null;
    const file = H.buildExport(sessions, settings);
    if(!sessions.length && !file.settings){ say('Nothing to export yet. Finish a session first.'); return; }
    const blob = new Blob([JSON.stringify(file, null, 1)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = H.exportFileName();
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=> URL.revokeObjectURL(url), 2000);
    say('Exported ' + plural(sessions.length, 'session') + (file.settings ? ' and your settings' : '') + '.');
  });

  // ----- Import: read the file, check it, then add it -----
  sec.querySelector('#dataImport').addEventListener('click', ()=>{ fileInput.value = ''; fileInput.click(); });
  fileInput.addEventListener('change', ()=>{
    const f = fileInput.files && fileInput.files[0];
    if(!f) return;
    if(f.size > 3000000){ say('That file is too large to be a Mindful Joy backup.', true); return; }
    const reader = new FileReader();
    reader.onerror = ()=> say('The file could not be read.', true);
    reader.onload = ()=>{
      const result = H.parseImport(String(reader.result));
      if(result.error){ say(result.error, true); return; }
      const have = H.loadSessions();
      const merged = H.mergeSessions(have, result.sessions);
      const useSettings = includeSettings.checked && result.settings;
      if(!merged.added && !useSettings){
        say(result.sessions.length ? 'Nothing new: all ' + plural(result.sessions.length, 'session') + ' in that backup are already here.' : 'That backup has no sessions in it.');
        return;
      }
      const ask = (merged.added
          ? 'Add ' + plural(merged.added, 'new session') + ' from this backup to your ' + have.length + '?'
          : 'Use the settings from this backup? Your history already has all of its sessions.')
        + (useSettings ? '\n\nIts settings (theme, bells and so on) will replace yours, and the page will reload.' : '');
      if(!confirm(ask)) { say('Import cancelled.'); return; }
      if(merged.added){
        if(!H.saveSessions(merged.sessions)){ say('Could not save: this browser is blocking storage.', true); return; }
        document.dispatchEvent(new Event('mj:history-changed'));
      }
      let msg = merged.added
        ? 'Imported ' + plural(merged.added, 'new session') + (result.sessions.length > merged.added ? ' (' + (result.sessions.length - merged.added) + ' already here)' : '') + '.'
        : 'No new sessions: the history was already here.';
      if(result.skipped) msg += ' Skipped ' + plural(result.skipped, 'entry') + ' that looked wrong.';
      if(useSettings){
        try{ localStorage.setItem(H.SETTINGS_KEY, JSON.stringify(Object.assign(readSettings() || {}, result.settings))); }catch(e){}
        say(msg + ' Applying settings…');
        setTimeout(()=> location.reload(), 1200);
      } else {
        say(msg);
      }
    };
    reader.readAsText(f);
  });
}
