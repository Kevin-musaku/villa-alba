import { NextRequest, NextResponse } from "next/server";
import { getBlockedDates } from "@/lib/availability/getBlockedDates";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// Il calendario di prenotazione non guarda mai oltre ~2 anni: un range più
// ampio (o malformato) è solo amplificazione a costo zero per chi chiama
// l'endpoint, non un uso legittimo.
const MAX_RANGE_DAYS = 730;

export async function GET(req: NextRequest) {
  const allowed = await checkRateLimit(`availability:${getClientIp(req)}`, {
    max: 60,
    windowSeconds: 60,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Troppe richieste, riprova tra poco." }, { status: 429 });
  }

  const from = req.nextUrl.searchParams.get("from") ?? undefined;
  const to = req.nextUrl.searchParams.get("to") ?? undefined;

  if (from && !DATE_RE.test(from)) {
    return NextResponse.json({ error: "Parametro from non valido" }, { status: 400 });
  }
  if (to && !DATE_RE.test(to)) {
    return NextResponse.json({ error: "Parametro to non valido" }, { status: 400 });
  }
  if (from && to) {
    const rangeDays = (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24);
    if (!Number.isFinite(rangeDays) || rangeDays < 0 || rangeDays > MAX_RANGE_DAYS) {
      return NextResponse.json({ error: "Intervallo di date non valido" }, { status: 400 });
    }
  }

  const blockedDates = await getBlockedDates(from, to);
  return NextResponse.json({ blockedDates });
}
