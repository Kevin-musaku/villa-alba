import { createHash, createHmac, randomUUID } from "crypto";

const SMOOBU_HOST = "https://login.smoobu.com";
const API_PREFIX = "/api";

let warned = false;

/**
 * Smoobu ha sostituito l'autenticazione legacy a singola chiave (header
 * "Api-Key", dismessa il 25 settembre 2026) con HMAC-SHA256: ogni richiesta
 * è firmata con API_KEY + API_SECRET, timestamp e nonce, per evitare replay.
 * Vedi docs/SETUP.md per come ottenere le due chiavi dalla dashboard Smoobu.
 */
export function isSmoobuConfigured(): boolean {
  return (
    Boolean(process.env.SMOOBU_API_KEY && process.env.SMOOBU_API_SECRET) ||
    process.env.SMOOBU_MOCK === "true"
  );
}

function warnOnce() {
  if (!warned) {
    console.warn(
      "[smoobu] SMOOBU_API_KEY/SMOOBU_API_SECRET non impostate — la sincronizzazione con Smoobu è disattivata. " +
        "Imposta entrambe (o SMOOBU_MOCK=true per un test locale) per attivarla. Vedi docs/SETUP.md."
    );
    warned = true;
  }
}

/**
 * Codifica la query string una sola volta, in modo deterministico, così la
 * stringa firmata nell'HMAC coincide byte per byte con quella davvero
 * inviata sul filo. In precedenza si firmava la stringa "grezza" (es.
 * "apartments[]=123") e poi si lasciava che `new URL()` la ri-codificasse
 * assegnandola a `.search` (diventa "apartments%5B%5D=123") — la firma non
 * corrispondeva più alla richiesta reale e Smoobu rispondeva 401 per ogni
 * parametro con caratteri speciali (es. l'endpoint /rates, che richiede
 * proprio "apartments[]").
 */
function sortedQueryString(params?: Record<string, string | number | undefined>): string {
  if (!params) return "";
  const entries = Object.entries(params)
    .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
    .map(([key, value]) => [key, String(value)] as [string, string])
    .sort(([a], [b]) => a.localeCompare(b));
  return entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

function signRequest(
  method: string,
  path: string,
  queryString: string,
  timestamp: string,
  nonce: string,
  bodyString: string,
  apiKey: string,
  apiSecret: string
): string {
  const bodyHash = createHash("sha256").update(bodyString).digest("hex");
  const canonical = [method, path, queryString, timestamp, nonce, bodyHash, apiKey].join("\n");
  return createHmac("sha256", apiSecret).update(canonical).digest("base64");
}

/**
 * Wrapper minimale per le chiamate REST HMAC-firmate a Smoobu. Non lancia mai
 * eccezioni: se le chiavi non sono configurate, ogni chiamata logga un
 * avviso e ritorna null — i chiamanti (pullAvailability/pushBooking) devono
 * gestirlo come "integrazione non ancora attiva", non come errore.
 */
export async function smoobuFetch<T>(
  path: string,
  init?: RequestInit & { query?: Record<string, string | number | undefined> }
): Promise<T | null> {
  const apiKey = process.env.SMOOBU_API_KEY;
  const apiSecret = process.env.SMOOBU_API_SECRET;
  if (!apiKey || !apiSecret) {
    warnOnce();
    return null;
  }

  const method = (init?.method ?? "GET").toUpperCase();
  const fullPath = `${API_PREFIX}${path}`;
  const queryString = sortedQueryString(init?.query);
  const bodyString = typeof init?.body === "string" ? init.body : "";
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const nonce = randomUUID();

  const signature = signRequest(
    method,
    fullPath,
    queryString,
    timestamp,
    nonce,
    bodyString,
    apiKey,
    apiSecret
  );

  const url = queryString
    ? `${SMOOBU_HOST}${fullPath}?${queryString}`
    : `${SMOOBU_HOST}${fullPath}`;

  try {
    const res = await fetch(url, {
      ...init,
      method,
      headers: {
        "X-API-Key": apiKey,
        "X-Timestamp": timestamp,
        "X-Nonce": nonce,
        "X-Signature": signature,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!res.ok) {
      console.error(`[smoobu] richiesta fallita (${res.status}) su ${path}`);
      return null;
    }
    if (res.status === 204) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.error("[smoobu] errore di rete", err);
    return null;
  }
}
