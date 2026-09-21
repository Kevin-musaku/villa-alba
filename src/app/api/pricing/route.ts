import { NextRequest, NextResponse } from "next/server";
import { calculateStay } from "@/lib/pricing/calculateStay";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

export async function GET(req: NextRequest) {
  const allowed = await checkRateLimit(`pricing:${getClientIp(req)}`, {
    max: 60,
    windowSeconds: 60,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Troppe richieste, riprova tra poco." }, { status: 429 });
  }

  const checkIn = req.nextUrl.searchParams.get("checkIn");
  const checkOut = req.nextUrl.searchParams.get("checkOut");

  if (!checkIn || !checkOut) {
    return NextResponse.json({ error: "checkIn e checkOut sono obbligatori" }, { status: 400 });
  }

  const guestsCountRaw = Number(req.nextUrl.searchParams.get("guestsCount") ?? "2");
  const guestsCount =
    Number.isInteger(guestsCountRaw) && guestsCountRaw >= 1 && guestsCountRaw <= 8 ? guestsCountRaw : 2;

  try {
    const quote = await calculateStay(checkIn, checkOut, guestsCount);
    return NextResponse.json(quote);
  } catch (err) {
    console.error("[api/pricing]", err);
    return NextResponse.json({ error: "Date non valide" }, { status: 400 });
  }
}
