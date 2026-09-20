import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ImageSection } from "@/lib/supabase/types";
import {
  heroImage,
  villaRoomImages,
  galleryImages,
  type PlaceholderImage,
} from "@/lib/placeholder-images";

export type ResolvedImage = PlaceholderImage;

// Testo alternativo di riserva quando l'admin carica una foto senza compilare
// il campo alt (importante per accessibilità e SEO immagini — un <img> senza
// alt descrittivo è invisibile per Google Immagini e per gli screen reader).
const SECTION_ALT_FALLBACK: Record<string, string> = {
  hero: "Villa Alba in Franciacorta",
  master: "Camera matrimoniale di Villa Alba",
  double1: "Camera matrimoniale di Villa Alba",
  double2: "Camera matrimoniale di Villa Alba",
  twin: "Camera con due letti singoli di Villa Alba",
  bathrooms: "Bagno di Villa Alba",
  cucina: "Cucina di Villa Alba",
  sala_da_pranzo: "Sala da pranzo di Villa Alba",
  soggiorno: "Soggiorno di Villa Alba",
  piscina: "Piscina di Villa Alba",
  esterno: "Giardino esterno di Villa Alba",
  territorio: "Il territorio della Franciacorta",
  gallery: "Villa Alba, Franciacorta",
  vini: "Vino della Franciacorta",
  cantine: "Cantina della Franciacorta",
};

/**
 * Ritorna le immagini di una sezione dal database (ordinate per sort_order).
 * Se Supabase non è configurato o la sezione non ha ancora immagini caricate
 * dal pannello admin, ritorna null così il chiamante può usare i segnaposto
 * locali definiti in src/lib/placeholder-images.ts.
 */
export async function getSectionImages(section: ImageSection): Promise<ResolvedImage[] | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("images")
    .select("storage_path, alt_text")
    .eq("section", section)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) console.error("[content/images] errore lettura sezione", section, error.message);
    return null;
  }

  return data.map((row) => ({
    src: row.storage_path,
    alt: row.alt_text?.trim() || SECTION_ALT_FALLBACK[section] || "Villa Alba, Franciacorta",
  }));
}

export async function getGalleryImages() {
  const dbImages = await getSectionImages("gallery");
  if (dbImages) {
    return dbImages.map((image, i) => ({
      category: galleryImages[i % galleryImages.length]?.category ?? "villa",
      image,
    }));
  }
  return galleryImages;
}

export async function getHeroImage(): Promise<PlaceholderImage> {
  const dbImages = await getSectionImages("hero");
  return dbImages?.[0] ?? heroImage;
}

/**
 * Ritorna l'immagine reale caricata dall'admin per una specifica stanza
 * (sezione = chiave della stanza, es. "master", "cucina", "piscina"), con
 * fallback al segnaposto locale se non ancora caricata nulla.
 */
export async function getVillaRoomImage(
  key: keyof typeof villaRoomImages
): Promise<PlaceholderImage> {
  const dbImages = await getSectionImages(key as ImageSection);
  return dbImages?.[0] ?? villaRoomImages[key];
}

export async function getAllVillaRoomImages(): Promise<Record<keyof typeof villaRoomImages, PlaceholderImage>> {
  const keys = Object.keys(villaRoomImages) as (keyof typeof villaRoomImages)[];
  const entries = await Promise.all(
    keys.map(async (key) => [key, await getVillaRoomImage(key)] as const)
  );
  return Object.fromEntries(entries) as Record<keyof typeof villaRoomImages, PlaceholderImage>;
}
