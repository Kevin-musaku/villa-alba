# Villa Alba — guida al collegamento dei servizi esterni

Il sito è già completo e funzionante, ma per attivare database, immagini
persistenti, pagamenti e sincronizzazione con Smoobu servono alcuni account
esterni gratuiti/a consumo che solo il proprietario può creare. Segui questi
passaggi nell'ordine indicato.

## 1. Supabase (database + immagini)

1. Crea un account su supabase.com e un nuovo progetto (scegli una regione
   in Europa, es. Frankfurt).
2. Nella sezione **SQL Editor** del progetto, esegui in ordine:
   - il contenuto di `supabase/migrations/0001_init.sql`
   - il contenuto di `supabase/seed.sql` (dati di esempio: alcuni vini e
     prezzi stagionali — puoi cancellarli/modificarli dopo dal pannello admin)
3. Nella sezione **Storage**, crea un nuovo bucket chiamato `site-images`
   con accesso **pubblico in lettura** (Public bucket: ON).
4. Nella sezione **Project Settings → API**, copia:
   - `Project URL` → variabile `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → variabile `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (segreta, non condividerla) → variabile
     `SUPABASE_SERVICE_ROLE_KEY`
5. Incolla questi tre valori in `.env.local` (in locale) e nelle
   Environment Variables del progetto Vercel (in produzione).

Finché queste variabili non sono impostate, il sito funziona comunque
mostrando immagini segnaposto e nascondendo automaticamente la sezione Vini
e le prenotazioni online.

## 2. Stripe (pagamenti)

1. Crea un account su stripe.com.
2. In modalità **test**, vai su Developers → API keys e copia:
   - `Secret key` → `STRIPE_SECRET_KEY`
   - `Publishable key` → `STRIPE_PUBLISHABLE_KEY`
3. Vai su Developers → Webhooks → Add endpoint, con URL
   `https://TUO-DOMINIO/api/stripe/webhook` e seleziona almeno gli eventi
   `checkout.session.completed` e `checkout.session.expired`. Copia il
   "Signing secret" → `STRIPE_WEBHOOK_SECRET`.
4. Testa una prenotazione dal sito usando la carta di test
   `4242 4242 4242 4242`, qualsiasi data futura e CVC.
5. Quando sei pronto ad accettare pagamenti reali, ripeti il passaggio 2-3
   in modalità **live** (attivando l'account Stripe con i dati della
   villa) e sostituisci le chiavi di test con quelle live.

## 3. Smoobu (sincronizzazione disponibilità — nessun iframe)

Il sito **non** incorpora un widget/iframe di Smoobu: le prenotazioni
dirette avvengono interamente sul sito con pagamento Stripe. Smoobu viene
usato solo in background per:

- leggere le prenotazioni arrivate da altri canali (Airbnb, Booking.com...)
  e bloccare automaticamente quelle date nel calendario del sito;
- inviare a Smoobu le prenotazioni dirette confermate sul sito, così anche
  gli altri canali vedono le date come occupate.

Smoobu ha sostituito l'autenticazione legacy a chiave singola con un sistema
HMAC (API Key + Secret, firma delle richieste) — la vecchia modalità viene
dismessa il 25 settembre 2026, quindi va usata quella nuova.

Per attivarlo:

1. Nel tuo account Smoobu, genera una API key: otterrai due valori distinti,
   la **API Key** (es. `usr_live_...`) → `SMOOBU_API_KEY`, e il **Secret**
   → `SMOOBU_API_SECRET`. Servono entrambi.
2. Recupera l'ID dell'appartamento/proprietà (visibile nell'URL o nelle
   impostazioni della proprietà) → `SMOOBU_PROPERTY_ID`.
3. Incolla tutti e tre i valori in `.env.local` / Vercel.
4. Su Vercel, la sincronizzazione gira automaticamente ogni 3 ore tramite
   un Cron Job già configurato (`vercel.json`). Puoi anche forzarla
   manualmente aprendo `/api/smoobu/sync`.

Per testare il flusso in locale senza un account Smoobu reale, imposta
`SMOOBU_MOCK=true`: la sincronizzazione userà una prenotazione finta di
esempio.

## 3bis. Resend (email di conferma prenotazione)

Facoltativo ma consigliato: dopo un pagamento confermato, l'ospite riceve
un'email di riepilogo (date, ospiti, totale pagato) nella lingua in cui ha
prenotato. Come Stripe/Smoobu, è best-effort: senza questa chiave la
prenotazione si conferma comunque, solo senza email.

1. Crea un account su resend.com.
2. Verifica un tuo dominio (es. villaalbafranciacorta.it) nella sezione
   **Domains** di Resend — è necessario per poter inviare email "da" quel
   dominio, altrimenti gli invii falliscono.
3. Copia la API key → `RESEND_API_KEY`.
4. In `src/lib/email.ts`, aggiorna `FROM_ADDRESS` con l'indirizzo del
   dominio che hai davvero verificato (di default è impostato un
   segnaposto `prenotazioni@villaalbafranciacorta.it`).

## 4. Pannello amministratore

- URL: `/admin/login`
- Email: quella impostata in `ADMIN_EMAIL`
- Password: quella usata per generare `ADMIN_PASSWORD_HASH`

Per cambiare la password in futuro:

```
npx tsx scripts/hash-password.ts "nuova-password"
```

Lo script stampa **due** valori: uno da incollare in `.env.local` (in
locale) e uno da incollare su Vercel. Sono diversi perché l'hash bcrypt
contiene simboli `$` che Next.js, solo quando legge un file `.env*` in
locale, interpreta come riferimenti a variabili — senza protezione
tronca l'hash e il login smette di funzionare. Usa sempre il valore che
lo script indica per ciascun posto, non copiarli a caso.

## 5. Prezzi extra: pulizie e tassa di soggiorno

Dal pannello admin → Calendario Prezzi puoi impostare, oltre al prezzo
base e al soggiorno minimo:

- **Costo pulizie finali** (una tantum, per soggiorno) — di default 0€,
  va impostato tu.
- **Tassa di soggiorno** (a persona, a notte) — precompilata a 1,50€,
  modificabile in qualunque momento.

Entrambe vengono sommate automaticamente al prezzo di ogni prenotazione
(mostrate come voci separate nel riepilogo e sulla pagina di pagamento
Stripe) e inviate a Smoobu insieme alla prenotazione.

## 6. Immagini per singola stanza

Il pannello Immagini permette di caricare una foto per ciascuna stanza
specifica (camere, bagni, cucina, sala da pranzo, soggiorno, piscina,
esterno) oltre a hero/territorio/galleria/vini/cantine — non più solo
una sezione generica "La Villa". Finché non carichi una foto per uno
slot, il sito mostra un segnaposto elegante di default.

## 7. Prima di andare online — checklist finale

Cosa manca *fuori* dal codice (nessuna nuova credenziale segreta
richiesta rispetto a quanto già impostato):

1. Comprare un dominio e collegarlo su Vercel (punto 8 sotto).
2. Creare il webhook Stripe puntato al dominio definitivo (§2.3) e
   incollare `STRIPE_WEBHOOK_SECRET` — senza, i pagamenti vengono presi
   ma le prenotazioni non risultano mai confermate.
3. Caricare le foto reali della villa (sostituiscono i segnaposto).
4. Impostare i prezzi reali (base, stagionali, pulizie) dal pannello
   admin.
5. Verificare periodicamente, se cambi la password admin, di rigenerare
   l'hash con `scripts/hash-password.ts` (§4).

## 8. Deploy su Vercel

1. Collega il repository a un nuovo progetto Vercel.
2. In Project Settings → Environment Variables, inserisci tutte le
   variabili elencate in `.env.local.example` con i valori reali.
3. Deploy. Il Cron Job per Smoobu si attiva automaticamente.
4. Aggiorna l'URL del webhook Stripe (punto 2.3) con il dominio definitivo
   una volta noto.

## 9. Sincronizzazione Smoobu ogni 5 minuti (oltre al cron giornaliero)

Il piano Vercel Hobby limita il proprio Cron Job (`vercel.json`) a una
volta al giorno. La migration `0007_smoobu_sync_cron.sql` aggiunge una
sincronizzazione molto più frequente (ogni 5 minuti) usando `pg_cron` +
`pg_net` dentro Supabase — gratuito su ogni piano, nessun servizio esterno.
Il cron giornaliero di Vercel resta comunque attivo come rete di sicurezza.

Passaggi manuali una tantum, da fare dopo il primo deploy:

1. **Genera un secret casuale** (es. `openssl rand -hex 32`) e impostalo
   su Vercel come variabile d'ambiente `CRON_SECRET`. Da quel momento
   `/api/smoobu/sync` richiede l'header `Authorization: Bearer <CRON_SECRET>`
   — Vercel lo aggiunge da solo alle chiamate del proprio cron, ma pg_cron
   deve riceverlo esplicitamente (punto 3).
2. Applica la migration `0007_smoobu_sync_cron.sql` (stesso procedimento
   usato per le altre, es. `psql` sulla connection string del pooler).
3. Nello SQL editor di Supabase, esegui (sostituendo i due placeholder):

   ```sql
   select vault.create_secret('https://IL-TUO-DOMINIO/api/smoobu/sync', 'smoobu_sync_url');
   select vault.create_secret('LO-STESSO-VALORE-DI-CRON_SECRET-SU-VERCEL', 'smoobu_sync_cron_secret');
   ```

4. Verifica che giri controllando `select * from cron.job_run_details
   order by start_time desc limit 5;` dopo qualche minuto.
5. **Quando colleghi il dominio definitivo**, aggiorna solo il primo
   secret (nessun redeploy del sito necessario, è un dato nel database):

   ```sql
   select vault.update_secret(
     (select id from vault.secrets where name = 'smoobu_sync_url'),
     'https://IL-NUOVO-DOMINIO/api/smoobu/sync'
   );
   ```

Nota: passare da 1 a ~288 chiamate/giorno verso l'API di Smoobu potrebbe
avvicinare eventuali limiti di rate-limit del vostro piano Smoobu — se nei
log compaiono errori 429, allarga l'intervallo modificando `'*/5 * * * *'`
nella migration (o rischedulando il job via SQL editor senza una nuova
migration: `select cron.alter_job(job_id, schedule := '*/10 * * * *')`).
