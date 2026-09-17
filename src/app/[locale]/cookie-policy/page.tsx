import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  return (
    <section className="mx-auto max-w-3xl px-6 py-28 md:px-10 md:py-36">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-graphite">
        {t("lastUpdated")}
      </p>
      <h1 className="mt-4 font-display text-4xl text-ink md:text-5xl">Cookie Policy</h1>

      {locale !== "it" && (
        <p className="mt-6 border border-mist bg-fog p-4 text-sm leading-relaxed text-graphite">
          {t("onlyItalianNotice")}
        </p>
      )}

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-graphite md:text-base">
        <p>
          Questa pagina descrive i cookie utilizzati dal sito di Villa Alba e come gestirli. Per
          informazioni generali sul trattamento dei dati vedi la nostra Privacy Policy.
        </p>

        <div>
          <h2 className="font-display text-xl text-ink">1. Cosa sono i cookie</h2>
          <p className="mt-3">
            I cookie sono piccoli file di testo che i siti visitati inviano al dispositivo
            dell&apos;utente, dove vengono memorizzati per essere poi ritrasmessi agli stessi siti
            alla visita successiva.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-ink">2. Cookie tecnici (sempre attivi)</h2>
          <p className="mt-3">
            Necessari al funzionamento del sito, non richiedono consenso: cookie di sessione per
            l&apos;accesso al pannello amministratore (NextAuth), e i cookie impostati da Stripe
            durante il processo di pagamento per prevenire le frodi.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-ink">3. Cookie di terze parti</h2>
          <p className="mt-3">
            Il sito non utilizza cookie di profilazione o pubblicitari. Alcuni fornitori tecnici
            (Supabase per il database, Stripe per i pagamenti) possono impostare cookie tecnici
            propri strettamente necessari a fornire il servizio richiesto.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-ink">4. Come gestire i cookie</h2>
          <p className="mt-3">
            Puoi gestire le preferenze sui cookie tecnici non essenziali tramite il banner mostrato
            alla prima visita, oppure in qualsiasi momento dalle impostazioni del tuo browser
            (Chrome, Firefox, Safari, Edge offrono tutte una sezione dedicata alla gestione dei
            cookie).
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-ink">5. Contatti</h2>
          <p className="mt-3">
            Per domande su questa Cookie Policy scrivi a villa.alba.franciacorta@gmail.com o PEC
            villa.alba.franciacorta@pec.it.
          </p>
        </div>
      </div>
    </section>
  );
}
