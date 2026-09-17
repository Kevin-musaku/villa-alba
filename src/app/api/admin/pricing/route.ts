import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PriceOverrideInputSchema } from "@/lib/validation/schemas";

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  let overridesQuery = supabase.from("pricing_calendar").select("*").order("date", { ascending: true });
  if (from) overridesQuery = overridesQuery.gte("date", from);
  if (to) overridesQuery = overridesQuery.lte("date", to);

  let smoobuQuery = supabase
    .from("smoobu_rates_cache")
    .select("date, price_cents")
    .order("date", { ascending: true });
  if (from) smoobuQuery = smoobuQuery.gte("date", from);
  if (to) smoobuQuery = smoobuQuery.lte("date", to);

  const [overridesRes, smoobuRes] = await Promise.all([overridesQuery, smoobuQuery]);

  if (overridesRes.error) return NextResponse.json({ error: overridesRes.error.message }, { status: 500 });
  if (smoobuRes.error) return NextResponse.json({ error: smoobuRes.error.message }, { status: 500 });

  return NextResponse.json({ overrides: overridesRes.data, smoobuRates: smoobuRes.data });
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });

  const parsed = PriceOverrideInputSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dati non validi" }, { status: 400 });

  const { dates, priceCents, note } = parsed.data;

  if (priceCents === null) {
    const { error } = await supabase.from("pricing_calendar").delete().in("date", dates);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, reset: dates.length });
  }

  const rows = dates.map((date) => ({
    date,
    price_cents: priceCents,
    note: note ?? null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("pricing_calendar").upsert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, updated: dates.length });
}
