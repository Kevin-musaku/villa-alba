-- Villa Alba — schema iniziale
-- Esegui questo file nell'SQL editor di Supabase (o via `supabase db push`)
-- dopo aver creato un nuovo progetto Supabase, poi esegui supabase/seed.sql.

create extension if not exists "pgcrypto";

-- ── Immagini, organizzate per sezione ────────────────────────────
create table public.images (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in
    ('hero','villa','territorio','gallery','vini','cantine')),
  storage_path text not null,
  alt_text text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index images_section_sort_idx on public.images (section, sort_order);

-- ── Vini ───────────────────────────────────────────────────────
create table public.wines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents int not null,
  currency text not null default 'EUR',
  image_storage_path text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Impostazioni globali del sito (riga singola) ─────────────────
create table public.site_settings (
  id boolean primary key default true,
  wine_section_enabled boolean not null default true,
  base_price_cents int not null default 25000,
  min_stay_nights int not null default 2,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id)
);
insert into public.site_settings (id) values (true);

-- ── Calendario prezzi per data ────────────────────────────────────
create table public.pricing_calendar (
  date date primary key,
  price_cents int not null,
  note text,
  updated_at timestamptz not null default now()
);

-- ── Prenotazioni dirette (dal nostro motore di prenotazione) ──────
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  check_in date not null,
  check_out date not null,
  guests_count int not null check (guests_count between 1 and 8),
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  amount_cents int not null,
  currency text not null default 'EUR',
  status text not null default 'pending'
    check (status in ('pending','confirmed','cancelled','refunded')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  smoobu_reservation_id text,
  smoobu_push_status text not null default 'not_pushed'
    check (smoobu_push_status in ('not_pushed','pushed','failed')),
  locale text not null default 'it',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_dates_check check (check_out > check_in)
);
create index bookings_dates_idx on public.bookings (check_in, check_out);
create index bookings_status_idx on public.bookings (status);

-- ── Date bloccate su altri canali, sincronizzate da Smoobu ────────
create table public.blocked_dates_cache (
  date date primary key,
  source text not null default 'smoobu',
  smoobu_reservation_id text,
  synced_at timestamptz not null default now()
);

-- ── Row Level Security ─────────────────────────────────────────
alter table public.images enable row level security;
alter table public.wines enable row level security;
alter table public.site_settings enable row level security;
alter table public.pricing_calendar enable row level security;
alter table public.bookings enable row level security;
alter table public.blocked_dates_cache enable row level security;

-- Lettura pubblica per i contenuti destinati al sito
create policy "images_public_read" on public.images
  for select using (true);

create policy "wines_public_read" on public.wines
  for select using (is_active = true);

create policy "site_settings_public_read" on public.site_settings
  for select using (true);

create policy "pricing_calendar_public_read" on public.pricing_calendar
  for select using (true);

-- bookings e blocked_dates_cache: nessun accesso anonimo.
-- Tutte le scritture (e le letture admin) passano dal server con la
-- service_role key, che ignora le policy RLS per definizione.
