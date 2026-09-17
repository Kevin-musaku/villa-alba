"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Trash2, Pencil, Plus } from "lucide-react";

type Activity = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  is_active: boolean;
  image_storage_path: string | null;
};

type Settings = { activities_section_enabled: boolean };

const emptyForm = { name: "", description: "", priceEuros: "", isActive: true, file: null as File | null };

export function ActivityManager() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [activitiesRes, settingsRes] = await Promise.all([
      fetch("/api/admin/activities").then((r) => r.json()),
      fetch("/api/admin/settings").then((r) => r.json()),
    ]);
    setActivities(activitiesRes.activities ?? []);
    setSettings(settingsRes.settings ?? null);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time fetch on mount
    load();
  }, []);

  async function toggleSection() {
    if (!settings) return;
    const next = !settings.activities_section_enabled;
    setSettings({ activities_section_enabled: next });
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activitiesSectionEnabled: next }),
    });
  }

  function openNew() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(activity: Activity) {
    setForm({
      name: activity.name,
      description: activity.description ?? "",
      priceEuros: (activity.price_cents / 100).toString(),
      isActive: activity.is_active,
      file: null,
    });
    setEditingId(activity.id);
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

    const url = editingId ? `/api/admin/activities/${editingId}` : "/api/admin/activities";
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
    const previous = activities;
    setActivities((prev) => prev.filter((a) => a.id !== id));
    const res = await fetch(`/api/admin/activities/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setActivities(previous);
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Impossibile eliminare l'attività.");
    }
  }

  if (loading) return <p className="text-sm text-stone">Caricamento...</p>;

  return (
    <div>
      <div className="flex items-center justify-between border border-mist bg-paper p-6">
        <div>
          <p className="text-sm text-ink">Mostra la sezione Attività sul sito pubblico</p>
          <p className="mt-1 text-xs text-stone">
            Se disattivata, la sezione scompare completamente dal sito, indipendentemente dalle
            attività presenti.
          </p>
        </div>
        <button
          onClick={toggleSection}
          className={`relative h-7 w-14 shrink-0 rounded-full transition-colors ${
            settings?.activities_section_enabled ? "bg-ink" : "bg-mist"
          }`}
          aria-pressed={settings?.activities_section_enabled}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-paper transition-transform ${
              settings?.activities_section_enabled ? "translate-x-8" : "translate-x-1"
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
          <Plus size={14} /> Aggiungi attività
        </button>
      </div>

      <div className="mt-6 divide-y divide-mist border border-mist bg-paper">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center gap-4 px-4 py-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-fog">
              {activity.image_storage_path && (
                <Image src={activity.image_storage_path} alt={activity.name} fill className="object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-ink">{activity.name}</p>
              <p className="text-xs text-stone">
                {(activity.price_cents / 100).toFixed(2)} € · {activity.is_active ? "Attiva" : "Nascosta"}
              </p>
            </div>
            <button onClick={() => openEdit(activity)} className="text-charcoal hover:text-ink" aria-label="Modifica">
              <Pencil size={16} />
            </button>
            <button onClick={() => handleDelete(activity.id)} className="text-charcoal hover:text-ink" aria-label="Elimina">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {activities.length === 0 && <p className="px-4 py-6 text-sm text-stone">Nessuna attività inserita.</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md space-y-4 border border-mist bg-paper p-6"
          >
            <h2 className="font-serif text-xl text-ink">{editingId ? "Modifica attività" : "Nuova attività"}</h2>

            <div>
              <label className="block text-xs uppercase tracking-[0.1em] text-stone">Nome</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full border border-mist bg-paper px-3 py-2 text-sm"
                placeholder="Es. Degustazione in cantina, Giro in barca sul Lago d'Iseo"
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
