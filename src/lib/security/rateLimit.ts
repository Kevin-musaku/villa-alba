import type { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Ricava l'IP del client dietro il proxy Vercel. NextRequest non espone più
 * un campo `.ip` diretto: il modo corretto è leggere x-forwarded-for
 * (Vercel lo popola con "client, proxy1, proxy2", il primo valore è quello
 * del client) con x-real-ip come fallback.
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Applica un rate limit a finestra fissa condiviso tra tutte le istanze
 * serverless (vedi migration 0009_rate_limits.sql). Se Supabase non è
 * configurato o la RPC fallisce per un problema infrastrutturale, la
 * richiesta viene lasciata passare: un rate limiter non deve diventare un
 * modo per bloccare il sito quando il DB ha un problema transitorio — non è
 * un controllo di autorizzazione, è un mitigazione anti-abuso.
 */
export async function checkRateLimit(
  key: string,
  options: { max: number; windowSeconds: number }
): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return true;

  const { data, error } = await supabase.rpc("rate_limit_hit", {
    p_key: key,
    p_max_requests: options.max,
    p_window_seconds: options.windowSeconds,
  });

  if (error) {
    console.error("[rateLimit] errore RPC rate_limit_hit", error.message);
    return true;
  }

  return Boolean(data);
}
