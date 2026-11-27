// Registers the service worker so the site can work offline, start fast and be installed.
// A new version of the site downloads in the background and takes over by itself (see sw.js),
// so the next load, reload or reopen shows it. Nothing here interrupts a session.
(function(){
  if(!('serviceWorker' in navigator)) return;
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').then(function(reg){
      // An installed app can stay open for days: look for a new version when it comes back to the front.
      document.addEventListener('visibilitychange', function(){
        if(document.visibilityState === 'visible') reg.update().catch(function(){});
      });
    }).catch(function(){});
  });
})();
