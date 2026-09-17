import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let warned = false;

/**
 * Client Supabase lato server con la service_role key (bypassa la RLS).
 * Usato da tutte le route admin e dalla logica di prenotazione.
 * Ritorna null se Supabase non è ancora configurato: il chiamante deve
 * gestire il fallback (vedi src/lib/content/*.ts).
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    if (!warned) {
      console.warn(
        "[supabase] Supabase non configurato — uso dati placeholder. " +
          "Imposta NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY per attivare il database."
      );
      warned = true;
    }
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
