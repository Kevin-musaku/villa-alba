import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function PrivacyPage({
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
      <h1 className="mt-4 font-display text-4xl text-ink md:text-5xl">Informativa sulla Privacy</h1>

      {locale !== "it" && (
        <p className="mt-6 border border-mist bg-fog p-4 text-sm leading-relaxed text-graphite">
          {t("onlyItalianNotice")}
        </p>
      )}

      <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-graphite md:text-base">
        <p>
          Titolare del trattamento: Villa Alba, Via Pietro Gobetti 7, Villa Pedergnano di Erbusco,
          25030 Franciacorta (BS), Italia — P.IVA 04800230981 — email
          villa.alba.franciacorta@gmail.com, PEC villa.alba.franciacorta@pec.it.
        </p>

        <div>
          <h2 className="font-display text-xl text-ink">1. Dati che raccogliamo</h2>
          <p className="mt-3">
            Dati forniti durante la prenotazione (nome, email, telefono, date del soggiorno, numero
            di ospiti); dati di navigazione tecnici (indirizzo IP, browser, pagine visitate — vedi la
            nostra Cookie Policy); dati di pagamento, gestiti direttamente da Stripe, che non
            transitano né vengono conservati sui nostri server.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-ink">2. Finalità del trattamento</h2>
          <p className="mt-3">
            Gestione delle prenotazioni e dei pagamenti; verifica della disponibilità e
            sincronizzazione del calendario con altri canali di vendita (Airbnb, Booking.com,
            tramite Smoobu); adempimento di obblighi legali e fiscali; miglioramento del servizio.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-ink">3. Base giuridica</h2>
          <p className="mt-3">
            Esecuzione di un contratto (gestione della prenotazione), consenso (cookie non tecnici),
            legittimo interesse (sicurezza del sito, prevenzione frodi), obbligo legale (conservazione
            fiscale dei dati di prenotazione).
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-ink">4. Conservazione e condivisione dei dati</h2>
          <p className="mt-3">
            I dati sono conservati su server Supabase nell&apos;Unione Europea. Sono condivisi solo
            con i fornitori strettamente necessari al servizio: Stripe (elaborazione dei pagamenti),
            Smoobu (channel manager e sincronizzazione del calendario), e, se configurato, un
            servizio di invio email per la conferma della prenotazione. I dati di prenotazione sono
            conservati per il tempo previsto dagli obblighi fiscali e civilistici.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-ink">5. I tuoi diritti</h2>
          <p className="mt-3">
            Ai sensi degli articoli 15-22 del GDPR hai diritto di accesso, rettifica, cancellazione,
            limitazione, portabilità e opposizione al trattamento dei tuoi dati, oltre al diritto di
            proporre reclamo al Garante per la Protezione dei Dati Personali. Per esercitare questi
            diritti scrivi a villa.alba.franciacorta@gmail.com.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-ink">6. Modifiche</h2>
          <p className="mt-3">
            Questa informativa può essere aggiornata nel tempo; la versione in vigore è sempre quella
            pubblicata su questa pagina.
          </p>
        </div>
      </div>
    </section>
  );
}
