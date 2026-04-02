// ── BABELOM PERSISTENT MUSIC PLAYER ── style v2 ──
(function() {

var PLAYLIST = [
  { titre: 'Mélodie du souvenir', src: 'music/piste1.mp3' },
  { titre: 'Mémoire collective',  src: 'music/piste2.mp3' },
  // Ajoutez vos prochaines pistes ici :
  // { titre: 'Titre du morceau', src: 'music/piste3.mp3' },
];

var audio    = null;
var pisteIdx = parseInt(localStorage.getItem('babelom-piste') || '0');

function creerLecteur() {
  if (document.getElementById('babelom-player')) return;
  var bar = document.createElement('div');
  bar.id = 'babelom-player';
  bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#1A1A2E;border-top:6px solid #FF6B35;padding:10px 20px;display:flex;align-items:center;gap:12px;font-family:\'Nunito\',sans-serif;transition:transform 0.3s ease;box-shadow:0 -4px 20px rgba(0,0,0,0.4);';

  bar.innerHTML = `
    <button id="bp-play" onclick="window.babelomToggle()"
      style="width:38px;height:38px;border-radius:50%;background:#FF6B35;border:none;color:white;font-size:1rem;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:transform 0.15s;box-shadow:0 2px 8px rgba(255,107,53,0.4);"
      onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">&#9654;</button>
    <button onclick="window.babelomNext()"
      style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#8B9CC8;font-size:0.8rem;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.15s;"
      onmouseover="this.style.background='rgba(255,107,53,0.2)';this.style.color='#FF6B35'" onmouseout="this.style.background='rgba(255,255,255,0.08)';this.style.color='#8B9CC8'">&#9197;</button>
    <div style="min-width:0;flex-shrink:0;width:160px;">
      <div id="bp-titre" style="font-size:0.78rem;font-weight:700;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">&#9834; BabelOm</div>
      <div id="bp-temps" style="font-size:0.62rem;color:#8B9CC8;margin-top:2px;">0:00 / 0:00</div>
    </div>
    <div style="flex:1;min-width:60px;">
      <div id="bp-bar" onclick="window.babelomSeek(event)"
        style="height:4px;background:rgba(255,255,255,0.12);border-radius:4px;cursor:pointer;position:relative;">
        <div id="bp-prog" style="height:100%;width:0%;background:linear-gradient(to right,#FF6B35,#FFD93D);border-radius:4px;pointer-events:none;transition:width 0.1s;"></div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B9CC8" stroke-width="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M15.54,8.46a5,5 0 0 1 0,7.07"/></svg>
      <input type="range" id="bp-vol" min="0" max="1" step="0.05" value="0.65"
        oninput="if(window._bpAudio)window._bpAudio.volume=this.value"
        style="width:60px;accent-color:#FF6B35;cursor:pointer;">
    </div>
    <button onclick="window.babelomHide()"
      style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#6B7A99;font-size:0.7rem;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
      onmouseover="this.style.background='rgba(255,107,53,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">&#9660;</button>
  `;
  document.body.appendChild(bar);
  document.body.style.paddingBottom = '60px';
}

function initPiste(autoplay) {
  if (audio) { audio.pause(); audio = null; }
  var p = PLAYLIST[pisteIdx];
  audio = new Audio(p.src);
  window._bpAudio = audio;
  audio.volume = parseFloat((document.getElementById('bp-vol')||{}).value||'0.65');
  var t = parseFloat(localStorage.getItem('babelom-time')||'0');
  if (t > 0) audio.currentTime = t;
  var el = document.getElementById('bp-titre');
  if (el) el.textContent = '\u266a ' + p.titre;
  audio.addEventListener('timeupdate', function() {
    localStorage.setItem('babelom-time', audio.currentTime);
    localStorage.setItem('babelom-piste', pisteIdx);
    if (!audio.duration) return;
    var prog = document.getElementById('bp-prog');
    var temps = document.getElementById('bp-temps');
    if (prog) prog.style.width = (audio.currentTime/audio.duration*100)+'%';
    if (temps) temps.textContent = fmt(audio.currentTime)+' / '+fmt(audio.duration);
  });
  audio.addEventListener('ended', function() {
    pisteIdx = (pisteIdx+1)%PLAYLIST.length;
    localStorage.setItem('babelom-piste', pisteIdx);
    localStorage.setItem('babelom-time', '0');
    localStorage.setItem('babelom-playing','true');
    initPiste(true); updateBtn(true);
  });
  if (autoplay) {
    audio.play().then(function(){ updateBtn(true); localStorage.setItem('babelom-playing','true'); }).catch(function(){});
  }
}

function fmt(s){ var m=Math.floor(s/60),sec=Math.floor(s%60); return m+':'+(sec<10?'0':'')+sec; }
function updateBtn(p){ var b=document.getElementById('bp-play'); if(b) b.innerHTML=p?'&#9646;&#9646;':'&#9654;'; }

window.babelomToggle=function(){ var a=window._bpAudio; if(!a){initPiste(true);return;} if(a.paused){a.play().then(function(){updateBtn(true);localStorage.setItem('babelom-playing','true');}).catch(function(){});}else{a.pause();updateBtn(false);localStorage.setItem('babelom-playing','false');}};
window.babelomNext=function(){ pisteIdx=(pisteIdx+1)%PLAYLIST.length; localStorage.setItem('babelom-piste',pisteIdx); localStorage.setItem('babelom-time','0'); var w=window._bpAudio&&!window._bpAudio.paused; initPiste(w); if(w)updateBtn(true); };
window.babelomSeek=function(e){ var a=window._bpAudio; if(!a||!a.duration)return; var b=document.getElementById('bp-bar'); audio.currentTime=(e.offsetX/b.offsetWidth)*a.duration; };
window.babelomHide=function(){ var p=document.getElementById('babelom-player'); if(p){p.style.transform='translateY(100%)';setTimeout(function(){p.style.display='none';},300);}};

document.addEventListener('DOMContentLoaded', function() {
  creerLecteur();
  var pause = localStorage.getItem('babelom-playing') === 'false';
  if (!pause) { setTimeout(function(){ initPiste(true); }, 400); }
  else { initPiste(false); }
});

})();
