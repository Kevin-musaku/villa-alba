"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Trash2, Pencil, Plus } from "lucide-react";

type Wine = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  is_active: boolean;
  image_storage_path: string | null;
};

type Settings = { wine_section_enabled: boolean };

const emptyForm = { name: "", description: "", priceEuros: "", isActive: true, file: null as File | null };

export function WineManager() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [winesRes, settingsRes] = await Promise.all([
      fetch("/api/admin/wines").then((r) => r.json()),
      fetch("/api/admin/settings").then((r) => r.json()),
    ]);
    setWines(winesRes.wines ?? []);
    setSettings(settingsRes.settings ?? null);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time fetch on mount
    load();
  }, []);

  async function toggleSection() {
    if (!settings) return;
    const next = !settings.wine_section_enabled;
    setSettings({ wine_section_enabled: next });
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wineSectionEnabled: next }),
    });
  }

  function openNew() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(wine: Wine) {
    setForm({
      name: wine.name,
      description: wine.description ?? "",
      priceEuros: (wine.price_cents / 100).toString(),
      isActive: wine.is_active,
      file: null,
    });
    setEditingId(wine.id);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const priceCents = Math.round(parseFloat(form.priceEuros.replace(",", ".")) * 100);
    const body = new FormData();
    body.append("name", form.name);
    body.append("description", form.description);
    body.append("priceCents", String(priceCents));
    body.append("isActive", String(form.isActive));
    if (form.file) body.append("file", form.file);

    const url = editingId ? `/api/admin/wines/${editingId}` : "/api/admin/wines";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, { method, body });
      if (res.ok) {
        setShowForm(false);
        await load();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? `Errore durante il salvataggio (${res.status})`);
      }
    } catch {
      setError("Impossibile contattare il server. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const previous = wines;
    setWines((prev) => prev.filter((w) => w.id !== id));
    const res = await fetch(`/api/admin/wines/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setWines(previous);
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Impossibile eliminare il vino.");
    }
  }

  if (loading) return <p className="text-sm text-stone">Caricamento...</p>;

  return (
    <div>
      <div className="flex items-center justify-between border border-mist bg-paper p-6">
        <div>
          <p className="text-sm text-ink">Mostra la sezione Vini sul sito pubblico</p>
          <p className="mt-1 text-xs text-stone">
            Se disattivata, la sezione scompare completamente dal sito, indipendentemente dai vini presenti.
          </p>
        </div>
        <button
          onClick={toggleSection}
          className={`relative h-7 w-14 shrink-0 rounded-full transition-colors ${
            settings?.wine_section_enabled ? "bg-ink" : "bg-mist"
          }`}
          aria-pressed={settings?.wine_section_enabled}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-paper transition-transform ${
              settings?.wine_section_enabled ? "translate-x-8" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {error && (
        <p className="mt-4 border border-charcoal/30 bg-fog px-3 py-2 text-xs text-charcoal">{error}</p>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={openNew}
          className="flex items-center gap-2 border border-ink px-4 py-2 text-xs uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-paper"
        >
          <Plus size={14} /> Aggiungi vino
        </button>
      </div>

      <div className="mt-6 divide-y divide-mist border border-mist bg-paper">
        {wines.map((wine) => (
          <div key={wine.id} className="flex items-center gap-4 px-4 py-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-fog">
              {wine.image_storage_path && (
                <Image src={wine.image_storage_path} alt={wine.name} fill className="object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-ink">{wine.name}</p>
              <p className="text-xs text-stone">
                {(wine.price_cents / 100).toFixed(2)} € · {wine.is_active ? "Attivo" : "Nascosto"}
              </p>
            </div>
            <button onClick={() => openEdit(wine)} className="text-charcoal hover:text-ink" aria-label="Modifica">
              <Pencil size={16} />
            </button>
            <button onClick={() => handleDelete(wine.id)} className="text-charcoal hover:text-ink" aria-label="Elimina">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {wines.length === 0 && <p className="px-4 py-6 text-sm text-stone">Nessun vino inserito.</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md space-y-4 border border-mist bg-paper p-6"
          >
            <h2 className="font-serif text-xl text-ink">{editingId ? "Modifica vino" : "Nuovo vino"}</h2>

            <div>
              <label className="block text-xs uppercase tracking-[0.1em] text-stone">Nome</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full border border-mist bg-paper px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.1em] text-stone">Descrizione</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="mt-1 w-full border border-mist bg-paper px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.1em] text-stone">Prezzo (€)</label>
              <input
                required
                inputMode="decimal"
                value={form.priceEuros}
                onChange={(e) => setForm((f) => ({ ...f, priceEuros: e.target.value }))}
                className="mt-1 w-full border border-mist bg-paper px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.1em] text-stone">Foto</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))}
                className="mt-1 w-full text-sm"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Visibile sul sito
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 border border-mist px-4 py-2 text-xs uppercase tracking-[0.1em] text-charcoal"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 border border-ink bg-ink px-4 py-2 text-xs uppercase tracking-[0.1em] text-paper disabled:opacity-50"
              >
                {saving ? "Salvataggio..." : "Salva"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
