#!/usr/bin/env python3
"""
patch-index-lieux.py
Corrige la liste "Mes lieux habités" dans index.html :
  - utilise le token de session Supabase (RLS) au lieu de SUPABASE_ANON
  - ajoute un délai pour laisser Supabase restaurer la session avant de charger les lieux
  - améliore l'affichage (boutons Modifier / Supprimer visibles)

Utilisation :
  python3 patch-index-lieux.py index.html
"""
import sys, os

if len(sys.argv) < 2:
    print("Usage: python3 patch-index-lieux.py index.html")
    sys.exit(1)

fname = sys.argv[1]
if not os.path.exists(fname):
    print("ERREUR : fichier introuvable :", fname)
    sys.exit(1)

content = open(fname, encoding='utf-8').read()

# ─────────────────────────────────────────────────────────────
# PATCH 1 — Remplacer chargerLieuxMembre + supprimerLieu
# ─────────────────────────────────────────────────────────────
START_MARKER = 'async function chargerLieuxMembre(user) {'
END_MARKER_OPTIONS = [
    '\ndocument.addEventListener(',
    '\nfunction confirmerSuppressionCompte(',
    '\nasync function supprimerMonCompte(',
]

start_idx = content.find(START_MARKER)
if start_idx == -1:
    print("ERREUR : chargerLieuxMembre introuvable dans", fname)
    sys.exit(1)

end_idx = -1
end_marker_found = ''
for em in END_MARKER_OPTIONS:
    pos = content.find(em, start_idx + 100)
    if pos != -1:
        if end_idx == -1 or pos < end_idx:
            end_idx = pos
            end_marker_found = em

if end_idx == -1:
    print("ERREUR : impossible de délimiter la fin de la section à remplacer")
    sys.exit(1)

print(f"Section trouvée : index {start_idx} → {end_idx} (fin avant '{end_marker_found.strip()}')")

NEW_FUNCTIONS = (
    "async function chargerLieuxMembre(user) {\n"
    "  var container = document.getElementById('lieux-loading');\n"
    "  var badge = document.getElementById('badge-nb-lieux');\n"
    "  try {\n"
    "    // Obtenir le token de session Supabase (nécessaire pour les politiques RLS)\n"
    "    var token = SUPABASE_ANON;\n"
    "    try {\n"
    "      var _sbL = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {auth:{persistSession:true}});\n"
    "      var sess = await _sbL.auth.getSession();\n"
    "      if (sess.data && sess.data.session && sess.data.session.access_token) {\n"
    "        token = sess.data.session.access_token;\n"
    "      }\n"
    "    } catch(se) { console.warn('token session:', se); }\n"
    "\n"
    "    var url = SUPABASE_URL + '/rest/v1/temoignages'\n"
    "      + '?select=id,adresse,ville,pays,annee_de,annee_a,type_logement'\n"
    "      + '&utilisateur_id=eq.' + encodeURIComponent(user.id)\n"
    "      + '&order=annee_de.asc';\n"
    "\n"
    "    var res = await fetch(url, {\n"
    "      headers: {\n"
    "        'apikey': SUPABASE_ANON,\n"
    "        'Authorization': 'Bearer ' + token,\n"
    "        'Content-Type': 'application/json'\n"
    "      }\n"
    "    });\n"
    "    if (!res.ok) throw new Error('HTTP ' + res.status);\n"
    "    var data = await res.json();\n"
    "\n"
    "    if (!container) return;\n"
    "    if (!Array.isArray(data) || !data.length) {\n"
    "      if (badge) badge.textContent = '0';\n"
    "      container.innerHTML = '<div style=\"font-size:0.75rem;color:rgba(255,255,255,0.5);'\n"
    "        + 'font-style:italic;padding:6px 4px;\">Aucun souvenir pour l\\'instant.&nbsp;'\n"
    "        + '<a href=\"etape1.html\" style=\"color:#FF6B35;\">+ En ajouter un</a></div>';\n"
    "      return;\n"
    "    }\n"
    "    if (badge) badge.textContent = data.length;\n"
    "\n"
    "    var colors = ['#FF6B35','#4ECDC4','#FFD93D','#6BCB77','#FF8B94'];\n"
    "    container.innerHTML = data.map(function(t, i) {\n"
    "      var lieu = [t.adresse, t.ville, t.pays].filter(Boolean).join(', ') || 'Lieu non précisé';\n"
    "      var dates = [t.annee_de, t.annee_a].filter(Boolean).join(' – ');\n"
    "      var col = colors[i % colors.length];\n"
    "      var id = t.id;\n"
    "      return '<div style=\"padding:8px 4px;border-bottom:1px solid rgba(255,255,255,0.08);'\n"
    "        + 'display:flex;align-items:flex-start;gap:8px;\" id=\"lieu-row-' + id + '\">'\n"
    "        + '<div style=\"width:8px;height:8px;border-radius:50%;background:' + col\n"
    "        + ';flex-shrink:0;margin-top:5px;\"></div>'\n"
    "        + '<div style=\"flex:1;min-width:0;\">'\n"
    "        + '<div style=\"font-size:0.78rem;font-weight:700;color:white;'\n"
    "        + 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;\" title=\"' + lieu + '\">'\n"
    "        + lieu + '</div>'\n"
    "        + '<div style=\"font-size:0.7rem;color:rgba(255,255,255,0.5);margin-top:1px;\">'\n"
    "        + (dates ? dates : '')\n"
    "        + (t.type_logement ? ' &middot; ' + t.type_logement : '') + '</div>'\n"
    "        + '</div>'\n"
    "        + '<div style=\"display:flex;flex-direction:column;gap:3px;flex-shrink:0;margin-top:2px;\">'\n"
    "        + '<button onclick=\"modifierLieu(\\'' + id + '\\')\" '\n"
    "        + 'style=\"background:rgba(255,107,53,0.2);color:#FF6B35;border:1px solid rgba(255,107,53,0.4);'\n"
    "        + 'font-size:0.68rem;padding:3px 8px;border-radius:4px;cursor:pointer;\">✏ Modifier</button>'\n"
    "        + '<button onclick=\"supprimerLieu(\\'' + id + '\\')\" '\n"
    "        + 'style=\"background:rgba(192,64,64,0.18);color:#FF8B94;border:1px solid rgba(192,64,64,0.35);'\n"
    "        + 'font-size:0.68rem;padding:3px 8px;border-radius:4px;cursor:pointer;\">🗑 Suppr.</button>'\n"
    "        + '</div>'\n"
    "        + '</div>';\n"
    "    }).join('');\n"
    "\n"
    "    // Ouvrir automatiquement la liste\n"
    "    var liste = document.getElementById('liste-lieux-hist');\n"
    "    var arrow = document.getElementById('arrow-hist');\n"
    "    if (liste) liste.style.display = 'block';\n"
    "    if (arrow) arrow.textContent = '\\u25b4';\n"
    "\n"
    "  } catch(e) {\n"
    "    console.error('chargerLieuxMembre:', e);\n"
    "    if (container) container.innerHTML = '<div style=\"font-size:0.75rem;color:#FF8B94;padding:4px 0;\">'\n"
    "      + 'Erreur : ' + e.message + '</div>';\n"
    "  }\n"
    "}\n"
    "\n"
    "function modifierLieu(id) {\n"
    "  var d = document.getElementById('menu-membre-dropdown');\n"
    "  if (d) d.style.display = 'none';\n"
    "  window.location.href = 'etape2.html?edit=' + id;\n"
    "}\n"
    "\n"
    "async function supprimerLieu(id) {\n"
    "  if (!confirm('Supprimer définitivement ce souvenir ? Cette action est irréversible.')) return;\n"
    "  var row = document.getElementById('lieu-row-' + id);\n"
    "  if (row) { row.style.opacity = '0.4'; row.style.pointerEvents = 'none'; }\n"
    "  try {\n"
    "    var token = SUPABASE_ANON;\n"
    "    try {\n"
    "      var _sbD = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {auth:{persistSession:true}});\n"
    "      var sess = await _sbD.auth.getSession();\n"
    "      if (sess.data && sess.data.session && sess.data.session.access_token) {\n"
    "        token = sess.data.session.access_token;\n"
    "      }\n"
    "    } catch(se) {}\n"
    "\n"
    "    var res = await fetch(SUPABASE_URL + '/rest/v1/temoignages?id=eq.' + id, {\n"
    "      method: 'DELETE',\n"
    "      headers: {\n"
    "        'apikey': SUPABASE_ANON,\n"
    "        'Authorization': 'Bearer ' + token,\n"
    "        'Content-Type': 'application/json'\n"
    "      }\n"
    "    });\n"
    "    if (res.ok || res.status === 204) {\n"
    "      if (row) row.remove();\n"
    "      var badge = document.getElementById('badge-nb-lieux');\n"
    "      if (badge) badge.textContent = Math.max(0, parseInt(badge.textContent || '1') - 1);\n"
    "    } else {\n"
    "      if (row) { row.style.opacity = '1'; row.style.pointerEvents = ''; }\n"
    "      var errData = await res.json().catch(function(){return {};});\n"
    "      alert('Erreur suppression : ' + (errData.message || 'HTTP ' + res.status));\n"
    "    }\n"
    "  } catch(e) {\n"
    "    if (row) { row.style.opacity = '1'; row.style.pointerEvents = ''; }\n"
    "    alert('Erreur réseau : ' + e.message);\n"
    "  }\n"
    "}\n"
    "\n"
)

content = content[:start_idx] + NEW_FUNCTIONS + content[end_idx:]
print("PATCH 1 appliqué — chargerLieuxMembre + supprimerLieu remplacés")

# ─────────────────────────────────────────────────────────────
# PATCH 2 — Ajouter délai 300ms avant chargerLieuxMembre dans DOMContentLoaded
# ─────────────────────────────────────────────────────────────
OLD_CALL = '  chargerLieuxMembre(user);\n});'
NEW_CALL = '  // Délai pour laisser Supabase restaurer la session OAuth\n  setTimeout(function() { chargerLieuxMembre(user); }, 400);\n});'

if OLD_CALL in content:
    content = content.replace(OLD_CALL, NEW_CALL, 1)
    print("PATCH 2 appliqué — délai 400ms dans DOMContentLoaded")
else:
    # Fallback — chercher juste l'appel
    alt = 'chargerLieuxMembre(user);'
    idx_call = content.rfind(alt)
    if idx_call != -1 and 'setTimeout' not in content[idx_call-50:idx_call]:
        content = content[:idx_call] + 'setTimeout(function() { chargerLieuxMembre(user); }, 400);' + content[idx_call + len(alt):]
        print("PATCH 2 appliqué (fallback) — délai injecté")
    else:
        print("PATCH 2 non nécessaire ou déjà appliqué")

open(fname, 'w', encoding='utf-8').write(content)
print(f"\n SUCCES : {fname} patché et sauvegardé")
print("Rechargez la page avec Ctrl+Shift+R pour voir les changements.")
