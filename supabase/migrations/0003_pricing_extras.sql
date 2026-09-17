-- Villa Alba — tassa di soggiorno e costo pulizie finali
-- Esegui dopo 0001_init.sql / 0002_* (idempotente: sicuro da rieseguire).

alter table public.site_settings
  add column if not exists cleaning_fee_cents int not null default 0,
  add column if not exists tourist_tax_cents_per_person_per_night int not null default 150;

alter table public.bookings
  add column if not exists rental_cents int,
  add column if not exists cleaning_fee_cents int,
  add column if not exists tourist_tax_cents int;
