import { WineManager } from "@/components/admin/WineManager";

export default function AdminViniPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl text-ink">Vini</h1>
      <p className="mt-2 max-w-2xl text-sm text-graphite">
        Gestisci l&apos;elenco dei vini in vendita e attiva o disattiva l&apos;intera sezione sul
        sito pubblico.
      </p>
      <div className="mt-8">
        <WineManager />
      </div>
    </div>
  );
}
