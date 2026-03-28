// ── BABELOM PERSISTENT MUSIC PLAYER ──
// Chargé sur toutes les pages — conserve la piste et la position entre les navigations

(function() {

var PLAYLIST = [
  { titre: 'Mélodie du souvenir',  src: 'music/piste1.mp3' },
  { titre: 'Mémoire collective',   src: 'music/piste2.mp3' },
  { titre: 'Aux lieux habités',    src: 'music/piste3.mp3' },
];

var audio    = null;
var pisteIdx = parseInt(localStorage.getItem('babelom-piste') || '0');
var isPlaying = localStorage.getItem('babelom-playing') === 'true';

// ── Injection du lecteur fixe ──
function creerLecteur() {
  if (document.getElementById('babelom-player')) return;

  var bar = document.createElement('div');
  bar.id = 'babelom-player';
  bar.style.cssText = [
    'position:fixed',
    'bottom:0',
    'left:0',
    'right:0',
    'z-index:9999',
    'background:rgba(20,38,26,0.97)',
    'backdrop-filter:blur(8px)',
    'border-top:1px solid rgba(212,136,10,0.3)',
    'padding:8px 20px',
    'display:flex',
    'align-items:center',
    'gap:14px',
    'font-family:\'Jost\',sans-serif',
    'transition:transform 0.3s ease',
  ].join(';');

  bar.innerHTML = `
    <button id="bp-play" onclick="window.babelomToggle()" title="Lecture / Pause"
      style="width:34px;height:34px;border-radius:50%;background:#d4880a;border:none;color:white;font-size:0.95rem;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:background 0.2s;">
      &#9654;
    </button>
    <div style="flex:1;min-width:0;">
      <div id="bp-titre" style="font-size:0.82rem;color:#e8dfc0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">&#9834; Babelom</div>
      <div id="bp-temps" style="font-size:0.65rem;color:#7a9a72;margin-top:1px;">0:00 / 0:00</div>
    </div>
    <div id="bp-bar" onclick="window.babelomSeek(event)"
      style="flex:2;height:3px;background:rgba(200,216,176,0.2);border-radius:2px;cursor:pointer;position:relative;min-width:60px;max-width:260px;">
      <div id="bp-prog" style="height:100%;width:0%;background:#d4880a;border-radius:2px;pointer-events:none;transition:width 0.1s;"></div>
    </div>
    <input type="range" id="bp-vol" min="0" max="1" step="0.05" value="0.65"
      oninput="if(window._bpAudio)window._bpAudio.volume=this.value"
      style="width:55px;accent-color:#d4880a;cursor:pointer;">
    <button onclick="window.babelomNext()" title="Piste suivante"
      style="background:none;border:none;color:#7a9a72;font-size:0.85rem;cursor:pointer;padding:2px;flex-shrink:0;">&#9197;</button>
    <button onclick="window.babelomHide()" title="Masquer"
      style="background:none;border:none;color:#4a6a52;font-size:0.75rem;cursor:pointer;padding:2px;flex-shrink:0;">&#9660;</button>
  `;

  document.body.appendChild(bar);

  // Ajouter padding en bas du body pour ne pas masquer le contenu
  document.body.style.paddingBottom = '52px';
}

// ── Initialiser la piste ──
function initPiste(autoplay) {
  if (audio) { audio.pause(); audio = null; }
  var p = PLAYLIST[pisteIdx];
  audio = new Audio(p.src);
  window._bpAudio = audio;
  audio.volume = parseFloat(document.getElementById('bp-vol').value || '0.65');
  // Reprendre la position mémorisée
  var savedTime = parseFloat(localStorage.getItem('babelom-time') || '0');
  if (savedTime > 0) audio.currentTime = savedTime;

  document.getElementById('bp-titre').textContent = '♪ ' + p.titre;

  audio.addEventListener('timeupdate', function() {
    localStorage.setItem('babelom-time', audio.currentTime);
    localStorage.setItem('babelom-piste', pisteIdx);
    if (!audio.duration) return;
    var pct = (audio.currentTime / audio.duration) * 100;
    var prog = document.getElementById('bp-prog');
    var temps = document.getElementById('bp-temps');
    if (prog) prog.style.width = pct + '%';
    if (temps) temps.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
  });

  audio.addEventListener('ended', function() {
    pisteIdx = (pisteIdx + 1) % PLAYLIST.length;
    localStorage.setItem('babelom-piste', pisteIdx);
    localStorage.setItem('babelom-time', '0');
    localStorage.setItem('babelom-playing', 'true');
    initPiste(true);
    updateBtn(true);
  });

  if (autoplay) {
    audio.play().then(function() {
      updateBtn(true);
      localStorage.setItem('babelom-playing', 'true');
    }).catch(function(){});
  }
}

function fmt(s) {
  var m = Math.floor(s/60), sec = Math.floor(s%60);
  return m + ':' + (sec<10?'0':'') + sec;
}

function updateBtn(playing) {
  var btn = document.getElementById('bp-play');
  if (btn) btn.innerHTML = playing ? '&#9646;&#9646;' : '&#9654;';
}

// ── API globale ──
window.babelomToggle = function() {
  if (!audio) { initPiste(true); return; }
  if (audio.paused) {
    audio.play().then(function(){ updateBtn(true); localStorage.setItem('babelom-playing','true'); });
  } else {
    audio.pause();
    updateBtn(false);
    localStorage.setItem('babelom-playing','false');
  }
};

window.babelomNext = function() {
  pisteIdx = (pisteIdx + 1) % PLAYLIST.length;
  localStorage.setItem('babelom-piste', pisteIdx);
  localStorage.setItem('babelom-time', '0');
  var wasPlaying = audio && !audio.paused;
  initPiste(wasPlaying);
  if (wasPlaying) updateBtn(true);
};

window.babelomSeek = function(e) {
  if (!audio || !audio.duration) return;
  var bar = document.getElementById('bp-bar');
  var pct = e.offsetX / bar.offsetWidth;
  audio.currentTime = pct * audio.duration;
};

window.babelomHide = function() {
  var p = document.getElementById('babelom-player');
  if (p) {
    p.style.transform = 'translateY(100%)';
    setTimeout(function(){ p.style.display='none'; }, 300);
  }
};

// ── Lancer ──
document.addEventListener('DOMContentLoaded', function() {
  creerLecteur();
  // Démarrer automatiquement sauf si l'utilisateur a volontairement mis en pause
  var pauseVolontaire = localStorage.getItem('babelom-playing') === 'false';
  if (!pauseVolontaire) {
    setTimeout(function() { initPiste(true); }, 400);
  } else {
    initPiste(false);
  }
});

})();
