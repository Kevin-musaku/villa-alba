import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { WineRow } from "@/lib/supabase/types";

export type PublicWine = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  imageSrc: string | null;
};

/**
 * Ritorna la lista dei vini attivi + lo stato della sezione (on/off).
 * Se Supabase non è configurato, la sezione risulta disattivata di default
 * (nessun contenuto reale da mostrare) piuttosto che rompere la pagina.
 */
export async function getPublicWines(): Promise<{
  enabled: boolean;
  wines: PublicWine[];
}> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { enabled: false, wines: [] };
  }

  const { data: settings } = await supabase
    .from("site_settings")
    .select("wine_section_enabled")
    .eq("id", true)
    .maybeSingle();

  const enabled = settings?.wine_section_enabled ?? false;
  if (!enabled) {
    return { enabled: false, wines: [] };
  }

  const { data, error } = await supabase
    .from("wines")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    if (error) console.error("[content/wines] errore lettura vini", error.message);
    return { enabled: false, wines: [] };
  }

  return {
    enabled: true,
    wines: (data as WineRow[]).map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description ?? "",
      priceCents: w.price_cents,
      currency: w.currency,
      imageSrc: w.image_storage_path,
    })),
  };
}
