import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth.config";

/**
 * Da usare all'inizio di ogni route handler /api/admin/*. Ritorna una
 * risposta 401 se non c'è una sessione admin valida, altrimenti null
 * (via libera a procedere).
 */
export async function requireAdminSession(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  return null;
}
