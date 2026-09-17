import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { uploadSiteImage, deleteSiteImage } from "@/lib/supabase/storage";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });

  const { id } = await params;
  const form = await req.formData();
  const name = form.get("name");
  const description = form.get("description");
  const priceCents = Number(form.get("priceCents"));
  const isActive = form.get("isActive") === "true";
  const file = form.get("file");

  if (typeof name !== "string" || !name.trim() || !Number.isFinite(priceCents)) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    name: name.trim(),
    description: typeof description === "string" ? description : "",
    price_cents: priceCents,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };

  if (file instanceof File && file.size > 0) {
    try {
      update.image_storage_path = await uploadSiteImage("vini", file);
    } catch (err) {
      console.error("[admin/wines/:id] errore upload immagine", err);
      return NextResponse.json({ error: "Errore caricamento immagine" }, { status: 500 });
    }
  }

  const { data, error } = await supabase.from("wines").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ wine: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });

  const { id } = await params;
  const { data: wine } = await supabase.from("wines").select("image_storage_path").eq("id", id).single();
  const { error } = await supabase.from("wines").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (wine?.image_storage_path) await deleteSiteImage(wine.image_storage_path);
  return NextResponse.json({ ok: true });
}
