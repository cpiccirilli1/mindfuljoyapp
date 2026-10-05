/* Shared color themes. Loaded in <head> on every page so the saved theme is applied before first paint. */
(function(){
  var SCHEMES = [
    { id:'dark',     name:'Dark',     bg:'#121214', surface:'#1b1b1e', text:'#e9e9ea', dim:'#97979c', accent:'#8a8f99', soft:'rgba(138,143,153,.16)', track:'#2a2a2e', border:'#2e2e33' },
    { id:'amoled',   name:'High Contrast', bg:'#000000', surface:'#000000', text:'#ffffff', dim:'#c8c8c8', accent:'#8cf0ae', soft:'rgba(140,240,174,.22)', track:'#404040', border:'#707070', header:'#000000' },
    { id:'tranquil', name:'Tranquil Green', bg:'#0f1c17', surface:'#16261f', text:'#e4ede7', dim:'#8da99a', accent:'#6fae84', soft:'rgba(111,174,132,.16)', track:'#223830', border:'#26382f' },
    { id:'sage',     name:'Sage',     bg:'#f3f5ef', surface:'#ffffff', text:'#2d332c', dim:'#798577', accent:'#7a9a7e', soft:'rgba(122,154,126,.14)', track:'#e3e8dc', border:'#dfe4d8' },
    { id:'sky',      name:'Sky',      bg:'#eef4f7', surface:'#ffffff', text:'#27323a', dim:'#71838c', accent:'#6fa3b8', soft:'rgba(111,163,184,.14)', track:'#dbe7ec', border:'#d8e4e9' },
    { id:'lavender', name:'Lavender', bg:'#f4f1f8', surface:'#ffffff', text:'#322c3c', dim:'#857c92', accent:'#9686b8', soft:'rgba(150,134,184,.14)', track:'#e5e0ee', border:'#e1dbea' },
    { id:'blush',    name:'Blush',    bg:'#f9f1f0', surface:'#ffffff', text:'#3a2b29', dim:'#92766f', accent:'#c08a80', soft:'rgba(192,138,128,.14)', track:'#eee0dd', border:'#ebdcd9' },
    { id:'sand',     name:'Sand',     bg:'#f7f3ea', surface:'#ffffff', text:'#352f24', dim:'#8a8068', accent:'#b79a5e', soft:'rgba(183,154,94,.14)',  track:'#ede5d2', border:'#e9e0cb' },
    { id:'teal',     name:'Teal',     bg:'#eaf4f2', surface:'#ffffff', text:'#1f3733', dim:'#5f8680', accent:'#4c9188', soft:'rgba(76,145,136,.14)',  track:'#d7e9e6', border:'#d2e5e2' },
    { id:'mauve',    name:'Mauve',    bg:'#f6f0f2', surface:'#ffffff', text:'#362a30', dim:'#8c7378', accent:'#a66e79', soft:'rgba(166,110,121,.14)', track:'#ecdfe2', border:'#e8dadd' },
    { id:'slate',    name:'Slate',    bg:'#eef1f3', surface:'#ffffff', text:'#242c31', dim:'#6c7a82', accent:'#5f8396', soft:'rgba(95,131,150,.14)',  track:'#dbe2e6', border:'#d7dfe3' }
  ];
  function applyScheme(s){
    const r = document.documentElement.style;
    r.setProperty('--bg', s.bg); r.setProperty('--surface', s.surface); r.setProperty('--text', s.text);
    r.setProperty('--text-dim', s.dim); r.setProperty('--accent', s.accent); r.setProperty('--accent-soft', s.soft);
    r.setProperty('--ring-track', s.track); r.setProperty('--border', s.border);
    if(s.header) r.setProperty('--header', s.header); else r.removeProperty('--header');
  }


  var STORE_KEY = 'still.settings.v1';
  function savedScheme(){
    try{ var d = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); return d && d.scheme; }catch(e){ return null; }
  }
  function find(id){ for(var i=0;i<SCHEMES.length;i++){ if(SCHEMES[i].id===id) return SCHEMES[i]; } return null; }
  window.MJ = { SCHEMES:SCHEMES, applyScheme:applyScheme, STORE_KEY:STORE_KEY, savedScheme:savedScheme, find:find };
  applyScheme(find(savedScheme()) || find('sage'));
})();
