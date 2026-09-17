import Stripe from "stripe";

let cached: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Ritorna il client Stripe, o null se STRIPE_SECRET_KEY non è ancora
 * impostata (nessun account Stripe collegato). I chiamanti devono gestire
 * il caso null restituendo un errore chiaro, mai un crash.
 */
export function getStripeClient(): Stripe | null {
  if (!isStripeConfigured()) return null;
  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: Stripe.API_VERSION as Stripe.LatestApiVersion,
    });
  }
  return cached;
}
