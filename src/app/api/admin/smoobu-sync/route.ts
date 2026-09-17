import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { pullAvailability } from "@/lib/smoobu/pullAvailability";
import { pullRates } from "@/lib/smoobu/pullRates";

const ERROR_MESSAGES: Record<string, string> = {
  supabase_not_configured:
    "Supabase non configurato — la sincronizzazione richiede un database collegato.",
  smoobu_not_configured:
    "Smoobu non configurato (SMOOBU_API_KEY/SMOOBU_API_SECRET assenti).",
  smoobu_request_failed:
    "La richiesta a Smoobu non è andata a buon fine — controlla i log del server.",
};

/**
 * Versione admin-autenticata della sincronizzazione, per il pulsante
 * "Sincronizza ora" nel pannello /admin/calendario. La rotta /api/smoobu/sync
 * resta separata perché è pensata per essere chiamata dal cron (Vercel o
 * pg_cron), non da una sessione utente.
 */
export async function POST() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const [availabilityResult, ratesResult] = await Promise.all([pullAvailability(), pullRates()]);

  const availability =
    "error" in availabilityResult
      ? { ok: false, error: ERROR_MESSAGES[availabilityResult.error] ?? "Sincronizzazione date non riuscita." }
      : { ok: true, synced: availabilityResult.synced };

  const rates =
    "error" in ratesResult
      ? { ok: false, error: ERROR_MESSAGES[ratesResult.error] ?? "Sincronizzazione tariffe non riuscita." }
      : { ok: true, synced: ratesResult.synced };

  return NextResponse.json({ ok: availability.ok && rates.ok, availability, rates });
}
