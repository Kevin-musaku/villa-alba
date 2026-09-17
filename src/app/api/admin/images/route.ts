import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { uploadSiteImage, deleteSiteImage } from "@/lib/supabase/storage";
import { ReorderInputSchema } from "@/lib/validation/schemas";
import type { ImageSection } from "@/lib/supabase/types";

const SECTIONS: ImageSection[] = [
  "hero",
  "master",
  "double1",
  "double2",
  "twin",
  "bathrooms",
  "cucina",
  "sala_da_pranzo",
  "soggiorno",
  "piscina",
  "esterno",
  "territorio",
  "gallery",
  "vini",
  "cantine",
];

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });
  }

  const section = req.nextUrl.searchParams.get("section");
  let query = supabase.from("images").select("*").order("sort_order", { ascending: true });
  if (section) query = query.eq("section", section);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ images: data });
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const section = form.get("section");
  const altText = form.get("altText");

  if (!(file instanceof File) || typeof section !== "string" || !SECTIONS.includes(section as ImageSection)) {
    return NextResponse.json({ error: "Dati mancanti o non validi" }, { status: 400 });
  }

  try {
    const publicUrl = await uploadSiteImage(section, file);

    const { count } = await supabase
      .from("images")
      .select("id", { count: "exact", head: true })
      .eq("section", section);

    const { data, error } = await supabase
      .from("images")
      .insert({
        section,
        storage_path: publicUrl,
        alt_text: typeof altText === "string" ? altText : null,
        sort_order: count ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ image: data }, { status: 201 });
  } catch (err) {
    console.error("[admin/images] errore upload", err);
    return NextResponse.json({ error: "Errore durante il caricamento" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id mancante" }, { status: 400 });

  const { data: image } = await supabase.from("images").select("storage_path").eq("id", id).single();
  const { error } = await supabase.from("images").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (image?.storage_path) await deleteSiteImage(image.storage_path);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });
  }

  const parsed = ReorderInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase.from("images").update({ sort_order: index }).eq("id", id)
    )
  );

  return NextResponse.json({ ok: true });
}
