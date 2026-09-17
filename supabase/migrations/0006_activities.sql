-- Villa Alba — sezione Attività (degustazioni, giri in barca, ecc.),
-- attivabile/disattivabile dal pannello admin, sullo stesso modello dei Vini.

create table public.activities (
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

alter table public.site_settings
  add column if not exists activities_section_enabled boolean not null default true;

alter table public.activities enable row level security;

create policy "activities_public_read" on public.activities
  for select using (is_active = true);
