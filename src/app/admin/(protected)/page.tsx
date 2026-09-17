import Link from "next/link";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = getSupabaseServerClient();
  const configured = isSupabaseConfigured();

  let upcoming: { check_in: string; check_out: string; guest_name: string }[] = [];
  let wineSectionEnabled: boolean | null = null;

  if (supabase) {
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: bookings }, { data: settings }] = await Promise.all([
      supabase
        .from("bookings")
        .select("check_in, check_out, guest_name")
        .eq("status", "confirmed")
        .gte("check_in", today)
        .order("check_in", { ascending: true })
        .limit(5),
      supabase.from("site_settings").select("wine_section_enabled").eq("id", true).maybeSingle(),
    ]);
    upcoming = bookings ?? [];
    wineSectionEnabled = settings?.wine_section_enabled ?? null;
  }

  return (
    <div>
      <h1 className="font-serif text-2xl text-ink">Dashboard</h1>

      {!configured && (
        <div className="mt-6 border border-mist bg-paper p-4 text-sm text-charcoal">
          Supabase non è ancora configurato. Segui{" "}
          <code className="bg-fog px-1">docs/SETUP.md</code> per collegare il database, lo
          storage immagini e attivare pagamenti e sincronizzazione con Smoobu.
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="border border-mist bg-paper p-6">
          <p className="text-xs uppercase tracking-[0.15em] text-stone">Sezione Vini</p>
          <p className="mt-3 font-serif text-xl text-ink">
            {wineSectionEnabled === null ? "—" : wineSectionEnabled ? "Attiva" : "Disattivata"}
          </p>
          <Link href="/admin/vini" className="mt-3 inline-block text-sm text-charcoal hover:text-ink">
            Gestisci →
          </Link>
        </div>

        <div className="border border-mist bg-paper p-6">
          <p className="text-xs uppercase tracking-[0.15em] text-stone">Immagini del sito</p>
          <p className="mt-3 font-serif text-xl text-ink">6 sezioni</p>
          <Link href="/admin/immagini" className="mt-3 inline-block text-sm text-charcoal hover:text-ink">
            Gestisci →
          </Link>
        </div>

        <div className="border border-mist bg-paper p-6">
          <p className="text-xs uppercase tracking-[0.15em] text-stone">Prossime prenotazioni</p>
          <p className="mt-3 font-serif text-xl text-ink">{upcoming.length}</p>
          <Link href="/admin/prenotazioni" className="mt-3 inline-block text-sm text-charcoal hover:text-ink">
            Vedi tutte →
          </Link>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm uppercase tracking-[0.15em] text-stone">Prossimi arrivi</h2>
          <ul className="mt-4 divide-y divide-mist border border-mist bg-paper">
            {upcoming.map((b, i) => (
              <li key={i} className="flex justify-between px-4 py-3 text-sm text-graphite">
                <span>{b.guest_name}</span>
                <span>{b.check_in} → {b.check_out}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
