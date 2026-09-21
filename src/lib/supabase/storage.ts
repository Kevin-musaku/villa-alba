import { getSupabaseServerClient } from "@/lib/supabase/server";

export const IMAGES_BUCKET = "site-images";

// Il bucket site-images è pubblico: un file non-immagine servito da lì (es.
// un SVG con <script>) verrebbe eseguito nel browser di chi lo apre. Non ci
// fidiamo né dell'estensione del filename né del Content-Type dichiarato dal
// client (entrambi falsificabili) — l'unica verifica affidabile è leggere i
// magic bytes reali del file e mappare da lì sia l'estensione che il
// Content-Type da salvare su Supabase.
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

type AllowedImageType = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

const EXTENSION_BY_TYPE: Record<AllowedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function sniffImageType(bytes: Uint8Array): AllowedImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (bytes.length >= 12) {
    const ftyp = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (ftyp === "ftyp" && (brand === "avif" || brand === "avis")) {
      return "image/avif";
    }
  }
  return null;
}

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

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`File troppo grande (massimo ${MAX_IMAGE_BYTES / (1024 * 1024)} MB).`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detectedType = sniffImageType(bytes);
  if (!detectedType) {
    throw new Error("Tipo di file non consentito (sono ammessi solo JPEG, PNG, WEBP, AVIF).");
  }

  const path = `${section}/${crypto.randomUUID()}.${EXTENSION_BY_TYPE[detectedType]}`;

  const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(path, bytes, {
    contentType: detectedType,
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
