import { ActivityManager } from "@/components/admin/ActivityManager";

export default function AdminAttivitaPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl text-ink">Attività</h1>
      <p className="mt-2 max-w-2xl text-sm text-graphite">
        Gestisci le attività prenotabili (degustazioni, giri in barca...) e attiva o disattiva
        l&apos;intera sezione sul sito pubblico.
      </p>
      <div className="mt-8">
        <ActivityManager />
      </div>
    </div>
  );
}
