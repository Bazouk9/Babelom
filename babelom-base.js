/* ═══════════════════════════════════════════════════════════════
   BABELOM — Fonctions de base partagées (babelom-base.js)
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
    localStorage.setItem('babelom-user',JSON.stringify({id:data.user.id,email:email,prenom:prenom,expires:Date.now()+7200000}));
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
      body:JSON.stringify({email:email,password:mdp,data:{prenom:prenom},options:{emailRedirectTo:'https://bazouk9.github.io/Babelom/confirmation.html'}})
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
      body:JSON.stringify({access_key:'7428a95d-fc84-4a4b-8c08-b4e4382c7946',subject:'[Babelom] '+objet,from_name:nom,reply_to:email,message:'De : '+nom+' <'+email+'>\nObjet : '+objet+'\n\n'+msg})
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
    o.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;align-items:center;justify-content:center;';
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
      mc.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9998;align-items:center;justify-content:center;';
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
