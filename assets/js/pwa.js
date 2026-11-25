// Registers the service worker so the site can work offline, start fast and be installed.
// When a new version of the site has been downloaded in the background, a small
// "New version available" bar offers a Reload. Nothing reloads by itself, so a running session is never cut off.
(function(){
  if(!('serviceWorker' in navigator)) return;

  var shown = false;
  function offerReload(worker){
    if(shown) return;
    shown = true;
    var bar = document.createElement('div');
    bar.className = 'update-toast';
    bar.setAttribute('role', 'status');
    bar.innerHTML = '<span>A new version is available.</span>'
      + '<button type="button" class="ut-reload">Reload</button>'
      + '<button type="button" class="ut-later" aria-label="Dismiss">Later</button>';
    document.body.appendChild(bar);
    bar.querySelector('.ut-later').addEventListener('click', function(){ bar.remove(); });
    bar.querySelector('.ut-reload').addEventListener('click', function(){
      var reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', function(){
        if(reloaded) return;
        reloaded = true;
        location.reload();
      });
      worker.postMessage('SKIP_WAITING');
    });
  }

  window.addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').then(function(reg){
      // A copy that finished downloading on an earlier visit and is waiting to take over.
      if(reg.waiting && navigator.serviceWorker.controller) offerReload(reg.waiting);
      reg.addEventListener('updatefound', function(){
        var w = reg.installing;
        if(!w) return;
        w.addEventListener('statechange', function(){
          if(w.state === 'installed' && navigator.serviceWorker.controller) offerReload(w);
        });
      });
      // An installed app can stay open for days: look for a new version when it comes back to the front.
      document.addEventListener('visibilitychange', function(){
        if(document.visibilityState === 'visible') reg.update().catch(function(){});
      });
    }).catch(function(){});
  });
})();
