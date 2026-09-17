import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { uploadSiteImage } from "@/lib/supabase/storage";
import { ReorderInputSchema } from "@/lib/validation/schemas";

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ activities: data });
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });

  const form = await req.formData();
  const name = form.get("name");
  const description = form.get("description");
  const priceCents = Number(form.get("priceCents"));
  const isActive = form.get("isActive") === "true";
  const file = form.get("file");

  if (typeof name !== "string" || !name.trim() || !Number.isFinite(priceCents)) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  let imageStoragePath: string | null = null;
  if (file instanceof File && file.size > 0) {
    try {
      imageStoragePath = await uploadSiteImage("attivita", file);
    } catch (err) {
      console.error("[admin/activities] errore upload immagine", err);
      return NextResponse.json({ error: "Errore caricamento immagine" }, { status: 500 });
    }
  }

  const { count } = await supabase.from("activities").select("id", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("activities")
    .insert({
      name: name.trim(),
      description: typeof description === "string" ? description : "",
      price_cents: priceCents,
      is_active: isActive,
      image_storage_path: imageStoragePath,
      sort_order: count ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ activity: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });

  const parsed = ReorderInputSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dati non validi" }, { status: 400 });

  await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase.from("activities").update({ sort_order: index }).eq("id", id)
    )
  );

  return NextResponse.json({ ok: true });
}
