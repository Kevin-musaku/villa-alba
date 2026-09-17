import { getSupabaseServerClient } from "@/lib/supabase/server";

export const IMAGES_BUCKET = "site-images";

/**
 * Carica un file nel bucket site-images sotto {section}/ e ritorna l'URL
 * pubblico. Lancia un errore esplicito se Supabase non è configurato: le
 * route che la chiamano devono già aver verificato la sessione admin, quindi
 * qui un fallimento è un vero errore da segnalare, non un caso da degradare.
 */
export async function uploadSiteImage(
  section: string,
  file: File
): Promise<string> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase non configurato: impossibile caricare immagini.");
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${section}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteSiteImage(storagePath: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const marker = `/${IMAGES_BUCKET}/`;
  const idx = storagePath.indexOf(marker);
  if (idx === -1) return;
  const relativePath = storagePath.slice(idx + marker.length);

  await supabase.storage.from(IMAGES_BUCKET).remove([relativePath]);
}
