-- Villa Alba — cache dei prezzi per notte sincronizzati da Smoobu
-- Stesso pattern di blocked_dates_cache: solo service_role, nessuna policy pubblica.

create table public.smoobu_rates_cache (
  date date primary key,
  price_cents int not null,
  synced_at timestamptz not null default now()
);

alter table public.smoobu_rates_cache enable row level security;
-- Nessuna policy pubblica: il pubblico vede il prezzo solo tramite /api/pricing
-- (calculateStay legge questa tabella server-side con la service_role key).
