/* ═══════════════════════════════════════════════════════════════
   BabelOm — Fonctions de base partagées (babelom-base.js)
   Charger sur TOUTES les pages après supabase-config.js
═══════════════════════════════════════════════════════════════ */

// ── Modales ──
function ouvrirModale(id){var el=document.getElementById(id);if(el)el.style.display='flex';}
function fermerModale(id){var el=document.getElementById(id);if(el)el.style.display='none';}

// ── Langue ──
function toggleLang(){var d=document.getElementById('lang-dropdown');if(d)d.style.display=d.style.display==='block'?'none':'block';}
function setLang(code){var el=document.getElementById('lang-current');if(el)el.textContent=code;var d=document.getElementById('lang-dropdown');if(d)d.style.display='none';if(typeof babelomApply==='function')babelomApply(code.toLowerCase());}
document.addEventListener('click',function(e){var ls=document.getElementById('lang-select');if(ls&&!ls.contains(e.target)){var d=document.getElementById('lang-dropdown');if(d)d.style.display='none';}});

// ── Session utilisateur ──
function babelomGetUser(){
  try{
    var r=localStorage.getItem('babelom-user');
    if(!r)return null;
    var u=JSON.parse(r);
    if(u.expires&&Date.now()>u.expires){localStorage.removeItem('babelom-user');return null;}
    return u;
  }catch(e){return null;}
}

// ── Navigation ──
function mettreAJourNav(){
  var user=babelomGetUser();
  var navUser=document.getElementById('nav-user');
  var navName=document.getElementById('nav-user-name');
  var topBtns=document.getElementById('top-band-btns');
  if(user){
    if(navUser)navUser.style.display='flex';
    if(navName)navName.textContent='\uD83D\uDC64 '+user.prenom;
    if(topBtns)topBtns.style.display='none';
  }else{
    if(navUser)navUser.style.display='none';
    if(topBtns)topBtns.style.display='flex';
  }
}

function seDeconnecter(){
  localStorage.removeItem('babelom-user');
  // Nettoyer aussi le token Supabase natif
  try {
    var keys = Object.keys(localStorage);
    keys.forEach(function(k){
      if(k.indexOf('-auth-token')!==-1 || k==='sb-babelom-auth') localStorage.removeItem(k);
    });
  } catch(e){}
  mettreAJourNav();
}

// ── Menu membre ──
function toggleMenuMembre(e){
  if(e)e.stopPropagation();
  var d=document.getElementById('menu-membre-dropdown');
  if(d)d.style.display=d.style.display==='none'||d.style.display===''?'block':'none';
}
document.addEventListener('click',function(e){
  var d=document.getElementById('menu-membre-dropdown');
  var btn=document.getElementById('btn-menu-membre');
  if(d&&btn&&!d.contains(e.target)&&!btn.contains(e.target))d.style.display='none';
});

function confirmerSuppressionCompte(){
  var d=document.getElementById('menu-membre-dropdown');
  if(d)d.style.display='none';
  var m=document.getElementById('modale-confirm-delete');
  if(m)m.style.display='flex';
}

// ── Connexion ──
async function seConnecter(){
  var email=document.getElementById('cx-email')?document.getElementById('cx-email').value.trim():'';
  var mdp=document.getElementById('cx-mdp')?document.getElementById('cx-mdp').value:'';
  var msg=document.getElementById('msg-cx');
  if(msg){msg.style.color='#4ECDC4';msg.textContent='Connexion...';}
  try{
    var res=await fetch('https://qbxshawdxqochjsmoodl.supabase.co/auth/v1/token?grant_type=password',{
      method:'POST',
      headers:{'apikey':SUPABASE_ANON,'Content-Type':'application/json'},
      body:JSON.stringify({email:email,password:mdp})
    });
    var data=await res.json();
    if(!res.ok)throw new Error(data.error_description||'Erreur');
    var prenom=data.user&&data.user.user_metadata&&data.user.user_metadata.prenom?data.user.user_metadata.prenom:email.split('@')[0];
    localStorage.setItem('babelom-user',JSON.stringify({id:data.user.id,email:email,prenom:prenom,token:data.access_token||'',expires:Date.now()+7200000}));
    // Stocker aussi le token Supabase pour les pages qui en ont besoin (RLS)
    var sbKey='sb-qbxshawdxqochjsmoodl-auth-token';
    if(data.access_token){
      localStorage.setItem(sbKey,JSON.stringify({
        access_token:data.access_token,
        refresh_token:data.refresh_token||'',
        expires_at:Math.floor(Date.now()/1000)+(data.expires_in||3600),
        token_type:'bearer',
        user:data.user
      }));
    }
    if(msg){msg.style.color='#6BCB77';msg.textContent='Connect\u00e9 !';}
    setTimeout(function(){mettreAJourNav();fermerModale('modale-cx');},800);
  }catch(e){if(msg){msg.style.color='#FF8B94';msg.textContent=e.message||'Erreur';}}
}

// ── Inscription ──
async function sInscrire(){
  var prenom=document.getElementById('ins-prenom')?document.getElementById('ins-prenom').value.trim():'';
  var email=document.getElementById('ins-email')?document.getElementById('ins-email').value.trim():'';
  var mdp=document.getElementById('ins-mdp')?document.getElementById('ins-mdp').value:'';
  var msg=document.getElementById('msg-ins');
  if(!prenom||!email||!mdp){if(msg){msg.style.color='#FF8B94';msg.textContent='Champs requis.';}return;}
  try{
    var res=await fetch('https://qbxshawdxqochjsmoodl.supabase.co/auth/v1/signup',{
      method:'POST',
      headers:{'apikey':SUPABASE_ANON,'Content-Type':'application/json'},
      body:JSON.stringify({email:email,password:mdp,data:{prenom:prenom},options:{emailRedirectTo:'https://babelom.com/confirmation.html'}})
    });
    var data=await res.json();
    if(!res.ok)throw new Error(data.error_description||'Erreur');
    if(msg){msg.style.color='#6BCB77';msg.textContent=data.access_token?'Connect\u00e9 !':'V\u00e9rifiez votre email.';}
    if(data.access_token){
      localStorage.setItem('babelom-user',JSON.stringify({id:data.user.id,email:email,prenom:prenom,expires:Date.now()+7200000}));
      setTimeout(function(){mettreAJourNav();fermerModale('modale-ins');},800);
    }
  }catch(e){if(msg){msg.style.color='#FF8B94';msg.textContent=e.message||'Erreur';}}
}

// ── Contact (web3forms) ──
function ouvrirContact(){var el=document.getElementById('modale-contact');if(el)el.style.display='flex';}
function fermerContact(){
  var el=document.getElementById('modale-contact');if(el)el.style.display='none';
  ['c-nom','c-email','c-message'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});
  var s=document.getElementById('c-objet');if(s)s.value='';
  var m=document.getElementById('contact-msg');if(m)m.textContent='';
}
async function envoyerContact(){
  var nom=document.getElementById('c-nom')?document.getElementById('c-nom').value.trim():'';
  var email=document.getElementById('c-email')?document.getElementById('c-email').value.trim():'';
  var objet=document.getElementById('c-objet')?document.getElementById('c-objet').value:'';
  var msg=document.getElementById('c-message')?document.getElementById('c-message').value.trim():'';
  var fb=document.getElementById('contact-msg');
  if(!nom||!email||!objet||!msg){if(fb){fb.style.color='#FF8B94';fb.textContent='Veuillez remplir tous les champs.';}return;}
  if(fb){fb.style.color='#4ECDC4';fb.textContent='Envoi en cours\u2026';}
  try{
    var res=await fetch('https://api.web3forms.com/submit',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({access_key:'7428a95d-fc84-4a4b-8c08-b4e4382c7946',subject:'[BabelOm] '+objet,from_name:nom,reply_to:email,message:'De : '+nom+' <'+email+'>\nObjet : '+objet+'\n\n'+msg})
    });
    var data=await res.json();
    if(data.success){
      if(fb){fb.style.color='#6BCB77';fb.textContent='\u2713 Message envoy\u00e9 !';}
      setTimeout(fermerContact,2500);
    }else{if(fb){fb.style.color='#FF8B94';fb.textContent='Erreur. R\u00e9essayez.';}}
  }catch(e){if(fb){fb.style.color='#FF8B94';fb.textContent='Erreur r\u00e9seau.';}}
}

// ── Modale contact : fermer au clic extérieur ──
document.addEventListener('DOMContentLoaded',function(){
  var mc=document.getElementById('modale-contact');
  if(mc)mc.addEventListener('click',function(e){if(e.target===this)fermerContact();});
  setTimeout(mettreAJourNav,100);
});

// ═══════════════════════════════════════════════════════════════
// INJECTION CSS + MODALES AU CHARGEMENT
// ═══════════════════════════════════════════════════════════════

(function() {

  // ── CSS boutons nav ──
  if (!document.getElementById('babelom-nav-css')) {
    var s = document.createElement('style');
    s.id = 'babelom-nav-css';
    s.textContent = '.top-btn{padding:5px 14px!important;border-radius:18px!important;font-size:0.72rem!important;font-weight:900!important;border:none!important;cursor:pointer!important;}'
      + '.btn-cx{background:white!important;color:#FF6B35!important;}'
      + '.btn-ins{background:#2c4a8a!important;color:white!important;border:1px solid rgba(255,255,255,0.3)!important;}';
    document.head.appendChild(s);
  }

  // ── Helper : input stylé ──
  function mkInput(type, id, ph) {
    var el = document.createElement('input');
    el.type = type; el.id = id; el.placeholder = ph;
    el.style.cssText = 'width:100%;padding:10px 14px;background:rgba(255,255,255,0.07);border:2px solid rgba(255,255,255,0.3);border-radius:8px;color:white;font-size:0.82rem;outline:none;margin-bottom:8px;';
    return el;
  }

  // ── Helper : bouton stylé ──
  function mkBtn(txt, bg, color, fn) {
    var b = document.createElement('button');
    b.textContent = txt;
    b.style.cssText = 'width:100%;padding:11px;border:none;border-radius:8px;font-size:0.78rem;font-weight:700;text-transform:uppercase;cursor:pointer;margin-top:4px;background:' + bg + ';color:' + color + ';';
    b.onclick = fn;
    return b;
  }

  // ── Helper : overlay modale ──
  function mkOverlay(id, closeFn) {
    var o = document.createElement('div');
    o.id = id;
    o.style.cssText = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;width:100vw;height:100vh;background:rgba(0,0,0,0.7);z-index:9999;align-items:center;justify-content:center;';
    o.addEventListener('click', function(e){ if(e.target===o) closeFn(); });
    return o;
  }

  function mkBox() {
    var b = document.createElement('div');
    b.style.cssText = 'background:#2c4a8a;border:1px solid #3358a0;padding:28px 32px;border-radius:14px;width:340px;max-width:90vw;font-family:Nunito,sans-serif;';
    return b;
  }

  function mkTitle(txt) {
    var h = document.createElement('h3');
    h.textContent = txt;
    h.style.cssText = 'font-size:1.2rem;color:#FF6B35;margin-bottom:16px;';
    return h;
  }

  function mkMsg(id) {
    var d = document.createElement('div');
    d.id = id;
    d.style.cssText = 'margin-top:8px;font-size:0.75rem;color:#4ECDC4;';
    return d;
  }

  function mkCancelBtn(txt, fn) {
    var b = document.createElement('button');
    b.textContent = txt;
    b.style.cssText = 'background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.6);padding:7px 14px;border-radius:8px;font-size:0.75rem;cursor:pointer;width:100%;margin-top:8px;';
    b.onclick = fn;
    return b;
  }

  document.addEventListener('DOMContentLoaded', function() {

    // ── Fermer toutes les modales existantes au chargement ──
    ['modale-cx','modale-ins','modale-contact'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    // ── Modale Connexion ──
    if (!document.getElementById('modale-cx')) {
      var ov = mkOverlay('modale-cx', function(){ fermerModale('modale-cx'); });
      var box = mkBox();
      box.appendChild(mkTitle('Se connecter'));
      box.appendChild(mkInput('email', 'cx-email', 'Email'));
      box.appendChild(mkInput('password', 'cx-mdp', 'Mot de passe'));
      box.appendChild(mkBtn('Connexion', '#FF6B35', 'white', function(){ seConnecter(); }));
      box.appendChild(mkMsg('msg-cx'));
      var lien = document.createElement('div');
      lien.style.cssText = 'margin-top:10px;text-align:center;font-size:0.72rem;color:rgba(255,255,255,0.5);';
      lien.appendChild(document.createTextNode('Pas encore ? '));
      var sp = document.createElement('span');
      sp.textContent = "S'inscrire";
      sp.style.cssText = 'color:#FF6B35;cursor:pointer;font-weight:700;';
      sp.onclick = function(){ fermerModale('modale-cx'); ouvrirModale('modale-ins'); };
      lien.appendChild(sp);
      box.appendChild(lien);
      box.appendChild(mkCancelBtn("Annuler", function(){ fermerModale('modale-cx'); }));
      ov.appendChild(box);
      document.body.appendChild(ov);
    }

    // ── Modale Inscription ──
    if (!document.getElementById('modale-ins')) {
      var ov2 = mkOverlay('modale-ins', function(){ fermerModale('modale-ins'); });
      var box2 = mkBox();
      box2.appendChild(mkTitle('Créer un compte'));
      box2.appendChild(mkInput('text', 'ins-prenom', 'Prénom'));
      box2.appendChild(mkInput('email', 'ins-email', 'Email'));
      box2.appendChild(mkInput('password', 'ins-mdp', 'Mot de passe (8 car. min)'));
      box2.appendChild(mkBtn("S'inscrire", '#4ECDC4', '#2c4a8a', function(){ sInscrire(); }));
      box2.appendChild(mkMsg('msg-ins'));
      box2.appendChild(mkCancelBtn("Annuler", function(){ fermerModale('modale-ins'); }));
      ov2.appendChild(box2);
      document.body.appendChild(ov2);
    }

    // ── Modale Contact ──
    if (!document.getElementById('modale-contact')) {
      var mc = document.createElement('div');
      mc.id = 'modale-contact';
      mc.style.cssText = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;width:100vw;height:100vh;background:rgba(0,0,0,0.75);z-index:9998;align-items:center;justify-content:center;';
      mc.addEventListener('click', function(e){ if(e.target===mc) fermerContact(); });
      var mcBox = document.createElement('div');
      mcBox.style.cssText = 'background:#1e2d50;border:1px solid #3358a0;padding:36px;max-width:500px;width:92%;border-radius:14px;font-family:Nunito,sans-serif;';
      var mcTitle = document.createElement('h3');
      mcTitle.innerHTML = 'Nous <em style="color:#FF6B35;">contacter</em>';
      mcTitle.style.cssText = 'font-family:Playfair Display,serif;font-size:1.5rem;font-weight:400;color:white;margin-bottom:20px;';
      mcBox.appendChild(mcTitle);
      ['c-nom:text:Nom & Prénom *', 'c-email:email:Email *'].forEach(function(spec) {
        var parts = spec.split(':');
        var inp = document.createElement('input');
        inp.id = parts[0]; inp.type = parts[1]; inp.placeholder = parts[2];
        inp.style.cssText = 'width:100%;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.2);color:white;font-family:Nunito,sans-serif;font-size:0.88rem;padding:10px 14px;outline:none;border-radius:8px;margin-bottom:10px;';
        mcBox.appendChild(inp);
      });
      var sel = document.createElement('select');
      sel.id = 'c-objet';
      sel.style.cssText = 'width:100%;background:#2c4a8a;border:1.5px solid rgba(255,255,255,0.2);color:white;font-family:Nunito,sans-serif;font-size:0.88rem;padding:10px 14px;outline:none;border-radius:8px;margin-bottom:10px;';
      [['', 'Objet *'],['question','Question générale'],['technique','Problème technique'],['suppression','Suppression de mes données'],['autre','Autre']].forEach(function(o){
        var opt = document.createElement('option'); opt.value=o[0]; opt.textContent=o[1]; sel.appendChild(opt);
      });
      mcBox.appendChild(sel);
      var ta = document.createElement('textarea');
      ta.id = 'c-message'; ta.placeholder = 'Votre message *'; ta.rows = 4;
      ta.style.cssText = 'width:100%;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.2);color:white;font-family:Nunito,sans-serif;font-size:0.88rem;padding:10px 14px;outline:none;border-radius:8px;resize:none;margin-bottom:16px;';
      mcBox.appendChild(ta);
      var cmsg = document.createElement('div'); cmsg.id='contact-msg'; cmsg.style.cssText='min-height:18px;font-size:0.8rem;margin-bottom:12px;';
      mcBox.appendChild(cmsg);
      var row = document.createElement('div'); row.style.cssText='display:flex;justify-content:space-between;';
      var ann = document.createElement('button'); ann.textContent='Annuler'; ann.onclick=function(){fermerContact();}; ann.style.cssText='background:none;border:none;color:rgba(255,255,255,0.5);font-family:Nunito,sans-serif;font-size:0.82rem;cursor:pointer;';
      var env = document.createElement('button'); env.textContent='Envoyer →'; env.onclick=function(){envoyerContact();}; env.style.cssText='background:#FF6B35;color:white;border:none;padding:10px 24px;font-family:Nunito,sans-serif;font-size:0.82rem;font-weight:700;border-radius:8px;cursor:pointer;';
      row.appendChild(ann); row.appendChild(env);
      mcBox.appendChild(row);
      mc.appendChild(mcBox);
      document.body.appendChild(mc);
    }

    setTimeout(mettreAJourNav, 100);
  });

})();

// ═══════════════════════════════════════════════════════════════
// BANNIÈRE COOKIES RGPD — injectée sur toutes les pages
// Stockage : localStorage uniquement, aucun cookie tiers
// ═══════════════════════════════════════════════════════════════

(function() {

  var CONSENT_KEY = 'babelom-cookies-consent';
  var CONSENT_VERSION = '1'; // incrémenter pour forcer réaffichage

  // Textes multilingues
  var COOKIE_TEXTS = {
    fr: {
      title: '🍪 Cookies & confidentialité',
      body: 'BabelOm utilise uniquement le <strong>stockage local</strong> (localStorage) pour votre session de connexion. <strong>Aucun cookie tiers, aucun traceur, aucune publicité.</strong>',
      accept: 'Accepter',
      decline: 'Continuer sans accepter',
      link: 'En savoir plus',
    },
    en: {
      title: '🍪 Cookies & Privacy',
      body: 'BabelOm uses only <strong>local storage</strong> (localStorage) for your login session. <strong>No third-party cookies, no trackers, no advertising.</strong>',
      accept: 'Accept',
      decline: 'Continue without accepting',
      link: 'Learn more',
    },
    pt: {
      title: '🍪 Cookies & Privacidade',
      body: 'BabelOm usa apenas <strong>armazenamento local</strong> (localStorage) para sua sessão. <strong>Sem cookies de terceiros, sem rastreadores, sem publicidade.</strong>',
      accept: 'Aceitar',
      decline: 'Continuar sem aceitar',
      link: 'Saiba mais',
    },
    he: {
      title: '🍪 עוגיות ופרטיות',
      body: 'BabelOm משתמש רק ב<strong>אחסון מקומי</strong> (localStorage) עבור הפעלת ההתחברות שלך. <strong>אין עוגיות צד שלישי, אין מעקב, אין פרסום.</strong>',
      accept: 'קבל',
      decline: 'המשך ללא קבלה',
      link: 'מידע נוסף',
    },
    ar: {
      title: '🍪 ملفات تعريف الارتباط والخصوصية',
      body: 'يستخدم بابيلوم فقط <strong>التخزين المحلي</strong> (localStorage) لجلسة تسجيل الدخول الخاصة بك. <strong>لا توجد ملفات تعريف ارتباط من طرف ثالث، ولا متتبعات، ولا إعلانات.</strong>',
      accept: 'قبول',
      decline: 'المتابعة بدون قبول',
      link: 'معرفة المزيد',
    },
    it: {
      title: '🍪 Cookie & Privacy',
      body: 'BabelOm utilizza solo il <strong>localStorage</strong> per la tua sessione di accesso. <strong>Nessun cookie di terze parti, nessun tracker, nessuna pubblicità.</strong>',
      accept: 'Accetta',
      decline: 'Continua senza accettare',
      link: 'Scopri di più',
    },
    ru: {
      title: '🍪 Файлы cookie и конфиденциальность',
      body: 'BabelOm использует только <strong>localStorage</strong> для вашей сессии. <strong>Никаких сторонних cookie, трекеров или рекламы.</strong>',
      accept: 'Принять',
      decline: 'Продолжить без принятия',
      link: 'Узнать больше',
    },
  };

  function getLang() {
    try {
      var saved = localStorage.getItem('babelom-lang');
      if (saved && COOKIE_TEXTS[saved]) return saved;
    } catch(e) {}
    var bl = (navigator.language || 'fr').slice(0, 2).toLowerCase();
    return COOKIE_TEXTS[bl] ? bl : 'fr';
  }

  function hasConsent() {
    try {
      var c = localStorage.getItem(CONSENT_KEY);
      if (!c) return false;
      var obj = JSON.parse(c);
      return obj && obj.version === CONSENT_VERSION;
    } catch(e) { return false; }
  }

  function saveConsent(accepted) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        version: CONSENT_VERSION,
        accepted: accepted,
        date: new Date().toISOString()
      }));
    } catch(e) {}
  }

  function hideBanner() {
    var el = document.getElementById('babelom-cookie-banner');
    if (el) {
      el.style.transform = 'translateY(120%)';
      el.style.opacity = '0';
      setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
    }
  }

  function showBanner() {
    var lang = getLang();
    var t = COOKIE_TEXTS[lang] || COOKIE_TEXTS['fr'];
    var isRtl = ['ar', 'he'].includes(lang);

    // CSS de la bannière
    var style = document.createElement('style');
    style.id = 'babelom-cookie-css';
    style.textContent = [
      '#babelom-cookie-banner {',
      '  position: fixed; bottom: 0; left: 0; right: 0; z-index: 99999;',
      '  background: #1a2a50; border-top: 3px solid #FF6B35;',
      '  padding: 14px 24px; box-shadow: 0 -4px 24px rgba(0,0,0,0.35);',
      '  font-family: Nunito, sans-serif; font-size: 0.84rem; color: rgba(255,255,255,0.92);',
      '  display: flex; align-items: center; flex-wrap: wrap; gap: 12px;',
      '  justify-content: space-between;',
      '  transition: transform 0.35s ease, opacity 0.35s ease;',
      '  direction: ' + (isRtl ? 'rtl' : 'ltr') + ';',
      '}',
      '#babelom-cookie-banner .cb-text { flex: 1; min-width: 220px; line-height: 1.5; }',
      '#babelom-cookie-banner .cb-text strong { color: #FFD93D; font-weight: 700; }',
      '#babelom-cookie-banner .cb-title { font-family: "Playfair Display", serif; font-size: 1rem; font-weight: 600; margin-bottom: 4px; color: white; }',
      '#babelom-cookie-banner .cb-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }',
      '#babelom-cookie-accept {',
      '  background: #FF6B35; color: white; border: none; border-radius: 20px;',
      '  padding: 8px 20px; font-family: Nunito, sans-serif; font-size: 0.8rem;',
      '  font-weight: 700; cursor: pointer; white-space: nowrap;',
      '  transition: background 0.2s;',
      '}',
      '#babelom-cookie-accept:hover { background: #e05520; }',
      '#babelom-cookie-decline {',
      '  background: transparent; color: rgba(255,255,255,0.55);',
      '  border: 1px solid rgba(255,255,255,0.25); border-radius: 20px;',
      '  padding: 7px 16px; font-family: Nunito, sans-serif; font-size: 0.78rem;',
      '  cursor: pointer; white-space: nowrap; transition: all 0.2s;',
      '}',
      '#babelom-cookie-decline:hover { border-color: rgba(255,255,255,0.6); color: rgba(255,255,255,0.85); }',
      '#babelom-cookie-link {',
      '  color: #4ECDC4; font-size: 0.76rem; text-decoration: none;',
      '  white-space: nowrap; opacity: 0.85;',
      '}',
      '#babelom-cookie-link:hover { opacity: 1; text-decoration: underline; }',
      '@media (max-width: 600px) {',
      '  #babelom-cookie-banner { padding: 12px 16px; }',
      '  #babelom-cookie-banner .cb-actions { width: 100%; justify-content: flex-end; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);

    // HTML de la bannière
    var banner = document.createElement('div');
    banner.id = 'babelom-cookie-banner';

    var textDiv = document.createElement('div');
    textDiv.className = 'cb-text';
    var titleDiv = document.createElement('div');
    titleDiv.className = 'cb-title';
    titleDiv.textContent = t.title;
    var bodyDiv = document.createElement('div');
    bodyDiv.innerHTML = t.body;
    textDiv.appendChild(titleDiv);
    textDiv.appendChild(bodyDiv);

    var actions = document.createElement('div');
    actions.className = 'cb-actions';

    var btnAccept = document.createElement('button');
    btnAccept.id = 'babelom-cookie-accept';
    btnAccept.textContent = t.accept;
    btnAccept.onclick = function() { saveConsent(true); hideBanner(); };

    var btnDecline = document.createElement('button');
    btnDecline.id = 'babelom-cookie-decline';
    btnDecline.textContent = t.decline;
    btnDecline.onclick = function() { saveConsent(false); hideBanner(); };

    var lien = document.createElement('a');
    lien.id = 'babelom-cookie-link';
    lien.href = 'confidentialite.html';
    lien.textContent = t.link;

    actions.appendChild(btnDecline);
    actions.appendChild(btnAccept);
    actions.appendChild(lien);

    banner.appendChild(textDiv);
    banner.appendChild(actions);

    document.body.appendChild(banner);
  }

  // Afficher uniquement si pas encore décidé
  document.addEventListener('DOMContentLoaded', function() {
    if (!hasConsent()) {
      // Léger délai pour ne pas bloquer le rendu initial
      setTimeout(showBanner, 600);
    }
  });

  // Exposer pour permettre réaffichage si besoin (ex: lien dans confidentialite.html)
  window.babelomShowCookieBanner = showBanner;
  window.babelomCookieConsent = function() {
    try { var c = localStorage.getItem(CONSENT_KEY); return c ? JSON.parse(c) : null; } catch(e) { return null; }
  };

})();
