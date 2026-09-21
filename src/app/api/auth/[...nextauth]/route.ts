import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/lib/auth/auth.config";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

export const { GET } = handlers;

// Solo il tentativo di login vero e proprio (POST .../callback/credentials)
// viene limitato: le altre chiamate di NextAuth su questa stessa rotta
// (csrf, session, providers) sono lookup innocui e vanno lasciati passare.
export async function POST(req: NextRequest) {
  if (req.nextUrl.pathname.endsWith("/callback/credentials")) {
    const allowed = await checkRateLimit(`login:${getClientIp(req)}`, {
      max: 5,
      windowSeconds: 300,
    });
    if (!allowed) {
      return NextResponse.json({ error: "Troppi tentativi. Riprova più tardi." }, { status: 429 });
    }
  }
  return handlers.POST(req);
}
