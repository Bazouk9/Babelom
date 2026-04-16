/* ═══════════════════════════════════════════════════════════════
   BABELOM — Modération côté client (Niveau 1)
   Vérifie le contenu AVANT envoi à Supabase.
   Le trigger SQL (niveau 2) constitue le filet de sécurité final.
═══════════════════════════════════════════════════════════════ */

const BABELOM_MODERATION = (function() {

  /* ── CATÉGORIE ROUGE : blocage immédiat ── */
  const MOTS_ROUGE = [
    // Racisme / haine
    'nègre','négresse','bougnoule','bicot','raton','feuj','youpin','youpine',
    'bamboula','sale arabe','sale juif','sale noir','sale blanc','chimpanzé',
    'sous-homme','sous-race','race inférieure','race supérieure',
    // Antisémitisme
    'zyklon','chambres à gaz','shoah mensonge','holocauste mensonge',
    'conspiration juive','protocoles des sages',
    // Violence / menaces
    'je vais te tuer','je vais te crever','mort aux','à mort les',
    'nique ta mère','va te faire foutre','enculé','fdp','fils de pute',
    'salope','connasse','pute','putain de',
    'enfoiré','enfoirée','enfoirés','enfoirées',
    'ordure','raclure','pourriture','vermine','déchet','immondice',
    'crétin','cretine','abruti','abrutie','imbécile','idiot','idiote',
    'espèce de','ta gueule','ferme ta gueule','va te faire','va crever',
    'je te hais','sale type','sale mec','sale gosse','sale gamine',
    'batard','bâtard','bâtarde','batarde',
    // Contenu sexuel explicite
    'pornographie','porno','sexe explicite','pipe','fellation','sodomie',
    // Pédophilie
    'enfant nu','mineur sexuel','pédophile','pédopornographie',
    // Spam / phishing
    'cliquez ici pour gagner','vous avez gagné','bitcoin gratuit',
    'transfert urgent','prince nigérian','héritage millions',
    'mot de passe','identifiants','code secret',
  ];

  /* ── CATÉGORIE ORANGE : signalement admin ── */
  const MOTS_ORANGE = [
    // Politique partisane
    'vote pour','élisez','macron','le pen','mélenchon','zemmour',
    'rassemblement national','france insoumise','parti communiste',
    // Publicité / commerce
    'à vendre','maison à vendre','appartement disponible','contactez-moi au',
    'prix négociable','petite annonce','bon plan',
    // Diffamation
    'c\'est un voleur','c\'est un escroc','c\'est un pédophile',
    'je dénonce','cet individu est',
  ];

  /* ── CATÉGORIE RGPD : données personnelles ── */
  const PATTERNS_RGPD = [
    { re: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, label: 'numéro de carte bancaire' },
    { re: /\b[1-2]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b/, label: 'numéro de sécurité sociale' },
    { re: /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/, label: 'adresse email' },
    { re: /\b(?:\+33|0033|0)[1-9](?:[\s.-]?\d{2}){4}\b/, label: 'numéro de téléphone' },
    { re: /https?:\/\/[^\s]+/, label: 'lien externe' },
  ];

  /* ── RÈGLES DE QUALITÉ ── */
  const QUALITE = {
    minChars: 30,
    maxChars: 4900,
    maxRepeat: 6,   // ex: "aaaaaaa" → rejeté
  };

  /* ── Normalisation du texte pour la détection ── */
  function normaliser(texte) {
    return texte
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // supprimer accents
      .replace(/[0-9]/g, c => ({'0':'o','1':'i','3':'e','4':'a','5':'s','8':'b'}[c] || c)) // leet speak
      .replace(/[^a-z\s]/g, ' ');
  }

  /* ── Vérification principale ── */
  function verifier(texte, options) {
    options = options || {};
    var isTemoignage = options.type === 'temoignage';
    var isMessage    = options.type === 'message';
    var texteNorm    = normaliser(texte);

    var result = {
      ok:        true,
      niveau:    null,   // 'rouge' | 'orange' | 'rgpd' | 'qualite'
      motTrouve: null,
      message:   null,
    };

    // 1. Qualité minimale (désactivée pour les messages privés)
    if (!isMessage && texte.trim().length < QUALITE.minChars) {
      return { ok: false, niveau: 'qualite', message: 'Votre texte est trop court (minimum ' + QUALITE.minChars + ' caractères).' };
    }
    if (/(.)\1{6,}/.test(texte)) {
      return { ok: false, niveau: 'qualite', message: 'Votre texte semble contenir des caractères répétés.' };
    }

    // 2. Mots rouges → blocage immédiat
    for (var i = 0; i < MOTS_ROUGE.length; i++) {
      var mot = normaliser(MOTS_ROUGE[i]);
      if (texteNorm.indexOf(mot) !== -1) {
        return {
          ok: false,
          niveau: 'rouge',
          motTrouve: MOTS_ROUGE[i],
          message: 'Ce contenu ne peut pas être publié sur Babelom. Il contient des termes non autorisés.',
        };
      }
    }

    // 3. Patterns RGPD → avertissement (ne bloque pas si message privé)
    for (var j = 0; j < PATTERNS_RGPD.length; j++) {
      if (PATTERNS_RGPD[j].re.test(texte)) {
        // Pour les messages : avertissement seulement
        if (isMessage) {
          result.avertissement = 'Attention : votre message semble contenir ' + PATTERNS_RGPD[j].label + '. Vérifiez avant d\'envoyer.';
        } else {
          return {
            ok: false,
            niveau: 'rgpd',
            message: 'Votre texte contient ' + PATTERNS_RGPD[j].label + '. Pour des raisons de confidentialité, ce type de donnée ne peut pas être publié.',
          };
        }
      }
    }

    // 4. Mots orange → signalement (enregistré mais marqué)
    for (var k = 0; k < MOTS_ORANGE.length; k++) {
      var motO = normaliser(MOTS_ORANGE[k]);
      if (texteNorm.indexOf(motO) !== -1) {
        result.signalement = true;
        result.motSignale  = MOTS_ORANGE[k];
        break;
      }
    }

    return result;
  }

  /* ── Vérification en temps réel (pendant la saisie) ── */
  function verifierTempsReel(texte) {
    var texteNorm = normaliser(texte);
    // Seulement les mots rouges et RGPD en temps réel
    for (var i = 0; i < MOTS_ROUGE.length; i++) {
      if (texteNorm.indexOf(normaliser(MOTS_ROUGE[i])) !== -1) {
        return { alerte: 'rouge', message: 'Ce contenu contient des termes non autorisés.' };
      }
    }
    for (var j = 0; j < PATTERNS_RGPD.length; j++) {
      if (PATTERNS_RGPD[j].re.test(texte)) {
        return { alerte: 'rgpd', message: 'Attention : ' + PATTERNS_RGPD[j].label + ' détecté.' };
      }
    }
    return { alerte: null };
  }

  /* ── API publique ── */
  return {
    verifier:         verifier,
    verifierTempsReel: verifierTempsReel,
  };

})();

/* ════════════════════════════════════════════════════════════════
   USAGE — Témoignages (etape2.html)
   ─────────────────────────────────────────────────────────────
   Avant l'appel Supabase :

   var check = BABELOM_MODERATION.verifier(texteAnecdotes, { type: 'temoignage' });
   if (!check.ok) {
     afficherErreur(check.message);
     return;
   }
   if (check.signalement) {
     objetTemoignage.statut = 'en_attente_moderation';
   }

   ════════════════════════════════════════════════════════════════
   USAGE — Messagerie (messagerie.html)
   ─────────────────────────────────────────────────────────────
   var check = BABELOM_MODERATION.verifier(contenuMessage, { type: 'message' });
   if (!check.ok) {
     afficherErreur(check.message);
     return;
   }
   if (check.avertissement) {
     // Afficher l'avertissement RGPD mais laisser envoyer
     afficherAvertissement(check.avertissement);
   }

   ════════════════════════════════════════════════════════════════
   USAGE — Temps réel (onInput sur textarea)
   ─────────────────────────────────────────────────────────────
   textarea.addEventListener('input', function() {
     var rt = BABELOM_MODERATION.verifierTempsReel(this.value);
     if (rt.alerte) {
       indicateur.style.color = rt.alerte === 'rouge' ? '#FF8B94' : '#FFD93D';
       indicateur.textContent = rt.message;
     } else {
       indicateur.textContent = '';
     }
   });
════════════════════════════════════════════════════════════════ */
