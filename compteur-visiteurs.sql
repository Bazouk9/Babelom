-- ═══════════════════════════════════════════════════════════════
-- COMPTEUR VISITEURS BABELOM — À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Créer la table compteur
CREATE TABLE IF NOT EXISTS visites (
  id          bigserial PRIMARY KEY,
  page        text NOT NULL DEFAULT 'index',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Autoriser les insertions anonymes (pas besoin d'être connecté)
ALTER TABLE visites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insertion publique visites"
ON visites FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Lecture admin visites"
ON visites FOR SELECT
TO authenticated
USING (true);

-- 3. Vérification
SELECT 'Table visites créée ✅' AS resultat;
