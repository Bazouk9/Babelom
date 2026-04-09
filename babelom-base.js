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
