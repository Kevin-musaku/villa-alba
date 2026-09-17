import { NextRequest, NextResponse } from "next/server";
import { getBlockedDates } from "@/lib/availability/getBlockedDates";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from") ?? undefined;
  const to = req.nextUrl.searchParams.get("to") ?? undefined;

  const blockedDates = await getBlockedDates(from, to);
  return NextResponse.json({ blockedDates });
}
