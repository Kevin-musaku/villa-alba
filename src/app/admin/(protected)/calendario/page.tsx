import { PricingCalendarManager } from "@/components/admin/PricingCalendarManager";

export default function AdminCalendarioPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl text-ink">Calendario Prezzi</h1>
      <p className="mt-2 max-w-2xl text-sm text-graphite">
        Imposta il prezzo per notte per date specifiche (es. alta stagione, festività). Le date
        senza un prezzo personalizzato usano il prezzo base.
      </p>
      <div className="mt-8">
        <PricingCalendarManager />
      </div>
    </div>
  );
}
