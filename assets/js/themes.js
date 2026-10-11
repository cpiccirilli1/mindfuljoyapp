/* Shared color themes. Loaded in <head> on every page so the saved theme is applied before first paint. */
(function(){
  var SCHEMES = [
    { id:'dark', group:'Dark',     name:'Dark',     bg:'#121214', surface:'#1b1b1e', text:'#e9e9ea', dim:'#97979c', accent:'#8a8f99', soft:'rgba(138,143,153,.16)', track:'#2a2a2e', border:'#2e2e33' },
    { id:'amoled', group:'High Contrast',   name:'High Contrast', bg:'#000000', surface:'#000000', text:'#ffffff', dim:'#c8c8c8', accent:'#8cf0ae', soft:'rgba(140,240,174,.22)', track:'#404040', border:'#707070', header:'#000000' },
    { id:'tranquil', group:'Dark', name:'Tranquil Green', bg:'#0f1c17', surface:'#16261f', text:'#e4ede7', dim:'#8da99a', accent:'#6fae84', soft:'rgba(111,174,132,.16)', track:'#223830', border:'#26382f' },
    { id:'sage', group:'Light',     name:'Sage',     bg:'#f3f5ef', surface:'#ffffff', text:'#2d332c', dim:'#798577', accent:'#7a9a7e', soft:'rgba(122,154,126,.14)', track:'#e3e8dc', border:'#dfe4d8' },
    { id:'sky', group:'Light',      name:'Sky',      bg:'#eef4f7', surface:'#ffffff', text:'#27323a', dim:'#71838c', accent:'#6fa3b8', soft:'rgba(111,163,184,.14)', track:'#dbe7ec', border:'#d8e4e9' },
    { id:'lavender', group:'Light', name:'Lavender', bg:'#f4f1f8', surface:'#ffffff', text:'#322c3c', dim:'#857c92', accent:'#9686b8', soft:'rgba(150,134,184,.14)', track:'#e5e0ee', border:'#e1dbea' },
    { id:'blush', group:'Light',    name:'Blush',    bg:'#f9f1f0', surface:'#ffffff', text:'#3a2b29', dim:'#92766f', accent:'#c08a80', soft:'rgba(192,138,128,.14)', track:'#eee0dd', border:'#ebdcd9' },
    { id:'sand', group:'Light',     name:'Sand',     bg:'#f7f3ea', surface:'#ffffff', text:'#352f24', dim:'#8a8068', accent:'#b79a5e', soft:'rgba(183,154,94,.14)',  track:'#ede5d2', border:'#e9e0cb' },
    { id:'teal', group:'Light',     name:'Teal',     bg:'#eaf4f2', surface:'#ffffff', text:'#1f3733', dim:'#5f8680', accent:'#4c9188', soft:'rgba(76,145,136,.14)',  track:'#d7e9e6', border:'#d2e5e2' },
    { id:'mauve', group:'Light',    name:'Mauve',    bg:'#f6f0f2', surface:'#ffffff', text:'#362a30', dim:'#8c7378', accent:'#a66e79', soft:'rgba(166,110,121,.14)', track:'#ecdfe2', border:'#e8dadd' },
    { id:'slate', group:'Light',    name:'Slate',    bg:'#eef1f3', surface:'#ffffff', text:'#242c31', dim:'#6c7a82', accent:'#5f8396', soft:'rgba(95,131,150,.14)',  track:'#dbe2e6', border:'#d7dfe3' },
    { id:'sage-night', group:'Dark', name:'Sage Night', bg:'#141813', surface:'#1c211b', text:'#e6ebe3', dim:'#9aa795', accent:'#9bbf9f', soft:'rgba(155,191,159,.16)', track:'#2a3228', border:'#2c342a' },
    { id:'sky-night', group:'Dark', name:'Sky Night', bg:'#0f161b', surface:'#172028', text:'#e3edf2', dim:'#93a6b1', accent:'#7fb6cc', soft:'rgba(127,182,204,.16)', track:'#243139', border:'#263139' },
    { id:'lavender-night', group:'Dark', name:'Lavender Night', bg:'#15121b', surface:'#1e1a27', text:'#ebe7f2', dim:'#a199b2', accent:'#aa9bd0', soft:'rgba(170,155,208,.16)', track:'#2e2839', border:'#302a3b' },
    { id:'blush-night', group:'Dark', name:'Blush Night', bg:'#1a1313', surface:'#241b1a', text:'#f2e8e6', dim:'#b0958f', accent:'#d49b91', soft:'rgba(212,155,145,.16)', track:'#3a2c2a', border:'#3a2e2c' },
    { id:'sand-night', group:'Dark', name:'Sand Night', bg:'#17140e', surface:'#201c14', text:'#efe9db', dim:'#a89e86', accent:'#cdb176', soft:'rgba(205,177,118,.16)', track:'#332d20', border:'#342e22' },
    { id:'teal-night', group:'Dark', name:'Teal Night', bg:'#0c1716', surface:'#132422', text:'#e0eeec', dim:'#8fada8', accent:'#66b5aa', soft:'rgba(102,181,170,.16)', track:'#1f3633', border:'#213734' },
    { id:'mauve-night', group:'Dark', name:'Mauve Night', bg:'#191216', surface:'#231a1e', text:'#f0e6e9', dim:'#ad939a', accent:'#c68b97', soft:'rgba(198,139,151,.16)', track:'#382a30', border:'#392c32' },
    { id:'slate-night', group:'Dark', name:'Slate Night', bg:'#121518', surface:'#1a1f23', text:'#e5eaee', dim:'#95a2ab', accent:'#85a9bd', soft:'rgba(133,169,189,.16)', track:'#272e34', border:'#283036' },
    { id:'midnight', group:'Dark', name:'Midnight', bg:'#0b1020', surface:'#131a2e', text:'#e4e9f5', dim:'#93a0bd', accent:'#7f9cf0', soft:'rgba(127,156,240,.16)', track:'#212a45', border:'#232c48' },
    { id:'cocoa', group:'Dark', name:'Cocoa', bg:'#1a1410', surface:'#241c16', text:'#efe6dd', dim:'#ad9a88', accent:'#d19a6a', soft:'rgba(209,154,106,.16)', track:'#382d24', border:'#3a2f26' },
    { id:'peach', group:'Light', name:'Peach', bg:'#fbf1ea', surface:'#ffffff', text:'#3b2b22', dim:'#7d6352', accent:'#a85830', soft:'rgba(168,88,48,.14)', track:'#f1e1d6', border:'#eddccf' },
    { id:'moss', group:'Light', name:'Moss', bg:'#f1f2e8', surface:'#ffffff', text:'#2c3022', dim:'#6b7058', accent:'#66752f', soft:'rgba(102,117,47,.14)', track:'#e3e6d3', border:'#dfe2cd' }
  ];
  function applyScheme(s){
    const r = document.documentElement.style;
    r.setProperty('--bg', s.bg); r.setProperty('--surface', s.surface); r.setProperty('--text', s.text);
    r.setProperty('--text-dim', s.dim); r.setProperty('--accent', s.accent); r.setProperty('--accent-soft', s.soft);
    r.setProperty('--ring-track', s.track); r.setProperty('--border', s.border);
    if(s.header) r.setProperty('--header', s.header); else r.removeProperty('--header');
    var meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content', s.bg);
  }
  // Fills a <select> with the themes, grouped (Light / Dark / High Contrast).
  function fillSelect(select, selectedId){
    ['Light','Dark','High Contrast'].forEach(function(g){
      var grp = document.createElement('optgroup');
      grp.label = g;
      SCHEMES.forEach(function(s){
        if(s.group !== g) return;
        var opt = document.createElement('option');
        opt.value = s.id; opt.textContent = s.name;
        if(s.id === selectedId) opt.selected = true;
        grp.appendChild(opt);
      });
      if(grp.children.length) select.appendChild(grp);
    });
  }


  var STORE_KEY = 'still.settings.v1';
  function savedScheme(){
    try{ var d = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); return d && d.scheme; }catch(e){ return null; }
  }
  function find(id){ for(var i=0;i<SCHEMES.length;i++){ if(SCHEMES[i].id===id) return SCHEMES[i]; } return null; }
  window.MJ = { SCHEMES:SCHEMES, applyScheme:applyScheme, fillSelect:fillSelect, STORE_KEY:STORE_KEY, savedScheme:savedScheme, find:find };
  applyScheme(find(savedScheme()) || find('sage'));
})();
