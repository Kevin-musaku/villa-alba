import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ActivityRow } from "@/lib/supabase/types";

export type PublicActivity = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  imageSrc: string | null;
};

/**
 * Ritorna la lista delle attività attive + lo stato della sezione (on/off).
 * Stesso pattern di getPublicWines(): se Supabase non è configurato o la
 * sezione è disattivata, ritorna vuoto invece di rompere la pagina.
 */
export async function getPublicActivities(): Promise<{
  enabled: boolean;
  activities: PublicActivity[];
}> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { enabled: false, activities: [] };
  }

  const { data: settings } = await supabase
    .from("site_settings")
    .select("activities_section_enabled")
    .eq("id", true)
    .maybeSingle();

  const enabled = settings?.activities_section_enabled ?? false;
  if (!enabled) {
    return { enabled: false, activities: [] };
  }

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    if (error) console.error("[content/activities] errore lettura attività", error.message);
    return { enabled: false, activities: [] };
  }

  return {
    enabled: true,
    activities: (data as ActivityRow[]).map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description ?? "",
      priceCents: a.price_cents,
      currency: a.currency,
      imageSrc: a.image_storage_path,
    })),
  };
}
