-- Villa Alba — rate limiting condiviso tra le istanze serverless.
--
-- Le route Vercel sono stateless e replicate: un contatore in memoria del
-- processo Node non basta a limitare un attaccante che colpisce istanze
-- diverse. Usiamo invece una tabella Postgres (già disponibile, nessun
-- servizio esterno da aggiungere) con una finestra fissa aggiornata in modo
-- atomico da un'unica istruzione INSERT ... ON CONFLICT, cosi' e' sicura
-- sotto richieste concorrenti.

create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 1
);

alter table public.rate_limits enable row level security;
-- Nessuna policy pubblica: solo il client server-side (service_role, che
-- bypassa la RLS) puo' leggere/scrivere, stesso pattern di public.bookings.

create or replace function public.rate_limit_hit(
  p_key text,
  p_max_requests integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set count = case
          when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
          then 1
          else public.rate_limits.count + 1
        end,
        window_start = case
          when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
          then now()
          else public.rate_limits.window_start
        end
  returning count into v_count;

  return v_count <= p_max_requests;
end;
$$;

revoke all on function public.rate_limit_hit(text, integer, integer) from public;

-- Pulizia periodica delle righe scadute (la tabella altrimenti cresce di una
-- riga per ogni IP/chiave mai vista). Riusa pg_cron, già abilitata dalla
-- migration 0007.
select
  cron.schedule(
    'rate-limits-cleanup-hourly',
    '17 * * * *',
    $$delete from public.rate_limits where window_start < now() - interval '1 day';$$
  )
where not exists (select 1 from cron.job where jobname = 'rate-limits-cleanup-hourly');
