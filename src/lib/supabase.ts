import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !key) {
  // Erreur visible au build/dev pour ne pas masquer un oubli d'env.
  // En prod, l'app n'aura pas de client → la page Login affichera une erreur.
  console.error(
    "[Supabase] Variables d'environnement manquantes : VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(url ?? "", key ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
