import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SiteSettingsInputSchema } from "@/lib/validation/schemas";

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });

  const { data, error } = await supabase.from("site_settings").select("*").eq("id", true).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}

export async function PATCH(req: NextRequest) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });

  const parsed = SiteSettingsInputSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dati non validi" }, { status: 400 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.wineSectionEnabled !== undefined) update.wine_section_enabled = parsed.data.wineSectionEnabled;
  if (parsed.data.activitiesSectionEnabled !== undefined)
    update.activities_section_enabled = parsed.data.activitiesSectionEnabled;
  if (parsed.data.basePriceCents !== undefined) update.base_price_cents = parsed.data.basePriceCents;
  if (parsed.data.minStayNights !== undefined) update.min_stay_nights = parsed.data.minStayNights;
  if (parsed.data.cleaningFeeCents !== undefined) update.cleaning_fee_cents = parsed.data.cleaningFeeCents;
  if (parsed.data.touristTaxCentsPerPersonPerNight !== undefined)
    update.tourist_tax_cents_per_person_per_night = parsed.data.touristTaxCentsPerPersonPerNight;

  const { data, error } = await supabase
    .from("site_settings")
    .update(update)
    .eq("id", true)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}
