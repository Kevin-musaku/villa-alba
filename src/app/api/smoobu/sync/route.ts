import { NextRequest, NextResponse } from "next/server";
import { pullAvailability, type PullAvailabilityResult } from "@/lib/smoobu/pullAvailability";
import { pullRates, type PullRatesResult } from "@/lib/smoobu/pullRates";

/**
 * Se CRON_SECRET è impostata, la richiesta deve portare
 * "Authorization: Bearer <CRON_SECRET>" (Vercel lo aggiunge da solo alle
 * chiamate del proprio cron; pg_cron/pg_net lo aggiungono via header
 * esplicito nella migration). Se CRON_SECRET non è impostata, il
 * comportamento resta quello di prima (nessuna autenticazione) — questa
 * rotta è pubblica per definizione, va invocata da cron esterni.
 */
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

const ERROR_MESSAGES: Record<string, string> = {
  supabase_not_configured:
    "Supabase non configurato — la sincronizzazione richiede un database collegato per salvare le date bloccate.",
  smoobu_not_configured:
    "Smoobu non configurato (SMOOBU_API_KEY/SMOOBU_API_SECRET assenti) — nessuna sincronizzazione eseguita.",
  smoobu_request_failed:
    "La richiesta a Smoobu non è andata a buon fine — controlla i log del server per i dettagli.",
};

function describe(result: PullAvailabilityResult | PullRatesResult) {
  if ("error" in result) {
    return { ok: false, error: ERROR_MESSAGES[result.error] ?? "Sincronizzazione non riuscita." };
  }
  return { ok: true, synced: result.synced };
}

async function handleSync() {
  const [availabilityResult, ratesResult] = await Promise.all([pullAvailability(), pullRates()]);

  const availability = describe(availabilityResult);
  const rates = describe(ratesResult);

  return NextResponse.json({
    ok: availability.ok && rates.ok,
    availability,
    rates,
  });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  return handleSync();
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  return handleSync();
}
