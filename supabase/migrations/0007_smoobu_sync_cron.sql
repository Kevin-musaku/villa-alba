-- Villa Alba — sincronizzazione Smoobu ogni 5 minuti via pg_cron + pg_net.
--
-- Il piano Vercel Hobby limita il SUO cron (vercel.json) a una volta al
-- giorno. Questo job gira invece dentro Supabase (gratuito su ogni piano) e
-- chiama l'endpoint /api/smoobu/sync del sito ogni 5 minuti, indipendente
-- dal limite di Vercel. Il cron giornaliero di vercel.json resta comunque
-- attivo come rete di sicurezza.
--
-- L'URL del sito e il secret di autenticazione NON vanno scritti qui in
-- chiaro (questo file finisce nel controllo versione): si leggono da
-- vault.decrypted_secrets, popolato una tantum a mano dallo SQL editor di
-- Supabase con:
--
--   select vault.create_secret('https://IL-TUO-DOMINIO/api/smoobu/sync', 'smoobu_sync_url');
--   select vault.create_secret('LO-STESSO-VALORE-DI-CRON_SECRET-SU-VERCEL', 'smoobu_sync_cron_secret');
--
-- Vedi docs/SETUP.md per i passaggi completi, incluso come aggiornare
-- smoobu_sync_url quando verrà collegato il dominio definitivo.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select
  cron.schedule(
    'smoobu-sync-5min',
    '*/5 * * * *',
    $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'smoobu_sync_url'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'smoobu_sync_cron_secret')
      )
    ) as request_id;
    $$
  )
where not exists (select 1 from cron.job where jobname = 'smoobu-sync-5min');
