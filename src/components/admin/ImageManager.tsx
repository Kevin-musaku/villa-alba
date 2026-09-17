"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, GripVertical, Upload } from "lucide-react";

type ImageRow = {
  id: string;
  section: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};

const SECTION_GROUPS: { group: string; sections: { key: string; label: string }[] }[] = [
  { group: "Generale", sections: [{ key: "hero", label: "Home / Hero" }] },
  {
    group: "Camere",
    sections: [
      { key: "master", label: "Camera Matrimoniale Indipendente" },
      { key: "double1", label: "Camera Matrimoniale" },
      { key: "double2", label: "Camera Matrimoniale con Bagno Privato" },
      { key: "twin", label: "Camera Doppia" },
      { key: "bathrooms", label: "Bagni" },
    ],
  },
  {
    group: "Cucina & Soggiorno",
    sections: [
      { key: "cucina", label: "Cucina" },
      { key: "sala_da_pranzo", label: "Sala da Pranzo" },
      { key: "soggiorno", label: "Soggiorno" },
    ],
  },
  {
    group: "Esterni",
    sections: [
      { key: "piscina", label: "Piscina" },
      { key: "esterno", label: "Giardino / Esterno" },
    ],
  },
  {
    group: "Altre sezioni",
    sections: [
      { key: "territorio", label: "Territorio" },
      { key: "gallery", label: "Galleria" },
      { key: "vini", label: "Vini (foto etichette)" },
      { key: "cantine", label: "Cantine (galleria)" },
    ],
  },
];

const SECTIONS = SECTION_GROUPS.flatMap((g) => g.sections);

export function ImageManager() {
  const [section, setSection] = useState(SECTIONS[0].key);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- toggling a loading flag while switching tabs and refetching
    setLoading(true);
    fetch(`/api/admin/images?section=${section}`)
      .then((r) => r.json())
      .then((data) => setImages(data.images ?? []))
      .finally(() => setLoading(false));
  }, [section]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const form = new FormData();
    form.append("file", file);
    form.append("section", section);

    try {
      const res = await fetch("/api/admin/images", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? `Errore durante il caricamento (${res.status})`);
      } else {
        setImages((prev) => [...prev, data.image]);
      }
    } catch {
      setError("Impossibile contattare il server. Riprova.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(id: string) {
    const previous = images;
    setImages((prev) => prev.filter((img) => img.id !== id));
    const res = await fetch(`/api/admin/images?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      setImages(previous);
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Impossibile eliminare l'immagine.");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((i) => i.id === active.id);
    const newIndex = images.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(images, oldIndex, newIndex);
    setImages(reordered);

    await fetch("/api/admin/images", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((i) => i.id) }),
    });
  }

  return (
    <div>
      <div className="space-y-3">
        {SECTION_GROUPS.map((g) => (
          <div key={g.group}>
            <p className="mb-1.5 text-[10px] uppercase tracking-[0.15em] text-stone">{g.group}</p>
            <div className="flex flex-wrap gap-2">
              {g.sections.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSection(s.key)}
                  className={`px-4 py-2 text-xs uppercase tracking-[0.1em] transition-colors ${
                    section === s.key ? "bg-ink text-paper" : "border border-mist text-charcoal hover:bg-fog"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <label className="mt-6 flex w-fit cursor-pointer items-center gap-2 border border-ink px-4 py-2 text-xs uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-paper">
        <Upload size={14} />
        {uploading ? "Caricamento..." : "Carica immagine"}
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>

      {error && (
        <p className="mt-3 border border-charcoal/30 bg-fog px-3 py-2 text-xs text-charcoal">{error}</p>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-stone">Caricamento...</p>
      ) : images.length === 0 ? (
        <p className="mt-8 text-sm text-stone">
          Nessuna immagine caricata per questa sezione: il sito mostra un segnaposto di default.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((img) => (
                <SortableImage key={img.id} image={img} onDelete={handleDelete} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableImage({ image, onDelete }: { image: ImageRow; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="group relative aspect-square overflow-hidden border border-mist"
    >
      <Image src={image.storage_path} alt={image.alt_text ?? ""} fill className="object-cover" />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-ink/60 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button {...attributes} {...listeners} className="text-paper" aria-label="Trascina per riordinare">
          <GripVertical size={16} />
        </button>
        <button onClick={() => onDelete(image.id)} className="text-paper" aria-label="Elimina">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
