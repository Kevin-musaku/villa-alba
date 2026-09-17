import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SiteSettingsRow } from "@/lib/supabase/types";

export const FALLBACK_BASE_PRICE_CENTS = 25000;
export const FALLBACK_MIN_STAY_NIGHTS = 2;
export const FALLBACK_CLEANING_FEE_CENTS = 0;
export const FALLBACK_TOURIST_TAX_CENTS_PER_PERSON_PER_NIGHT = 150;

export type SiteSettings = {
  wineSectionEnabled: boolean;
  activitiesSectionEnabled: boolean;
  basePriceCents: number;
  minStayNights: number;
  cleaningFeeCents: number;
  touristTaxCentsPerPersonPerNight: number;
};

const FALLBACK_SETTINGS: SiteSettings = {
  wineSectionEnabled: false,
  activitiesSectionEnabled: false,
  basePriceCents: FALLBACK_BASE_PRICE_CENTS,
  minStayNights: FALLBACK_MIN_STAY_NIGHTS,
  cleaningFeeCents: FALLBACK_CLEANING_FEE_CENTS,
  touristTaxCentsPerPersonPerNight: FALLBACK_TOURIST_TAX_CENTS_PER_PERSON_PER_NIGHT,
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return FALLBACK_SETTINGS;
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle<SiteSettingsRow>();

  if (error || !data) {
    if (error) console.error("[content/settings] errore lettura impostazioni", error.message);
    return FALLBACK_SETTINGS;
  }

  return {
    wineSectionEnabled: data.wine_section_enabled,
    activitiesSectionEnabled: data.activities_section_enabled ?? false,
    basePriceCents: data.base_price_cents,
    minStayNights: data.min_stay_nights,
    cleaningFeeCents: data.cleaning_fee_cents ?? FALLBACK_CLEANING_FEE_CENTS,
    touristTaxCentsPerPersonPerNight:
      data.tourist_tax_cents_per_person_per_night ?? FALLBACK_TOURIST_TAX_CENTS_PER_PERSON_PER_NIGHT,
  };
}
