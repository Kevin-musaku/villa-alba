-- Villa Alba — prezzo per notte della prenotazione (email di conferma con
-- dettaglio esatto notte per notte, non una media).
-- Esegui dopo 0001_init.sql...0007_*.sql (idempotente: sicuro da rieseguire).

alter table public.bookings
  add column if not exists nightly_prices jsonb;
