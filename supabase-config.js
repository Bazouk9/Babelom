// ═══════════════════════════════════════════════
// BABELOM — Configuration Supabase
// Remplacez les deux valeurs ci-dessous par vos
// clés trouvées dans : Supabase > Settings > API
// ═══════════════════════════════════════════════

const SUPABASE_URL  = 'https://qbxshawdxqochjsmoodl.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFieHNoYXdkeHFvY2hqc21vb2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNTQxMTIsImV4cCI6MjA4ODgzMDExMn0.SuCjjsBKOeuPyg8m1ZUb2h9XLtxZ5O5rf48GUolo3zM';

// ── Client Supabase léger (sans SDK) ──
const sb = {

  async query(table, options = {}) {
    const { method = 'GET', body, select, filters = [], limit, order } = options;
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const params = [];
    if (select)          params.push(`select=${encodeURIComponent(select)}`);
    if (limit)           params.push(`limit=${limit}`);
    if (order)           params.push(`order=${order}`);
    filters.forEach(f => params.push(f));
    if (params.length)   url += '?' + params.join('&');

    const res = await fetch(url, {
      method,
      headers: {
        'apikey':        SUPABASE_ANON,
        'Authorization': 'Bearer ' + SUPABASE_ANON,
        'Content-Type':  'application/json',
        'Prefer':        method === 'POST' ? 'return=representation' : '',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Erreur ${res.status}`);
    }
    return method === 'DELETE' ? null : res.json();
  },

  // ── Raccourcis ──
  select: (table, opts)   => sb.query(table, { ...opts, method: 'GET' }),
  insert: (table, body)   => sb.query(table, { method: 'POST', body }),
  update: (table, body, filters) => sb.query(table, { method: 'PATCH', body, filters }),

  // ── Upload photo vers Supabase Storage ──
  async uploadPhoto(file, path) {
    // Récupérer le token JWT depuis le localStorage Supabase (persiste entre les pages)
    let token = SUPABASE_ANON;
    try {
      // Supabase stocke la session sous la clé sb-{ref}-auth-token
      const storageKey = 'sb-qbxshawdxqochjsmoodl-auth-token';
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const session = JSON.parse(raw);
        const t = session?.access_token || session?.session?.access_token;
        if (t) token = t;
      }
    } catch(e) {}

    const url = `${SUPABASE_URL}/storage/v1/object/temoignages-photos/${path}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey':        SUPABASE_ANON,
        'Authorization': 'Bearer ' + token,
        'Content-Type':  file.type,
        'Cache-Control': '3600',
        'x-upsert':      'true',
      },
      body: file,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur upload photo ' + res.status);
    }
    return `${SUPABASE_URL}/storage/v1/object/public/temoignages-photos/${path}`;
  },

  // ── Hash SHA-256 d'un mot de passe ──
  async hashMdp(mdp) {
    const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(mdp));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }
};
