-- Dati di esempio per sviluppo/demo. Esegui dopo 0001_init.sql.
-- Le immagini NON sono seedate qui: finché la tabella `images` è vuota per
-- una sezione, il sito usa automaticamente i segnaposto in
-- src/lib/placeholder-images.ts. Basta caricare foto vere dal pannello
-- admin (/admin/immagini) per sostituirle sezione per sezione.

insert into public.wines (name, description, price_cents, is_active, sort_order) values
  ('Franciacorta Brut DOCG', 'Blend classico di Chardonnay e Pinot Nero, affinato oltre 24 mesi sui lieviti. Fresco e minerale, perfetto come aperitivo.', 2800, true, 1),
  ('Franciacorta Saten DOCG', 'Solo uve Chardonnay, pressione ridotta per una spuma finissima. Elegante e morbido, ideale a tutto pasto.', 3200, true, 2),
  ('Franciacorta Rose DOCG', 'Pinot Nero in prevalenza, colore rosa tenue e note di frutti rossi. Da provare con i salumi del territorio.', 3400, true, 3),
  ('Franciacorta Extra Brut Millesimato', 'Annata selezionata, lungo affinamento e dosaggio minimo. Per chi cerca un Franciacorta di carattere.', 4200, true, 4);

insert into public.pricing_calendar (date, price_cents, note) values
  ('2026-08-01', 38000, 'Alta stagione — agosto'),
  ('2026-08-02', 38000, 'Alta stagione — agosto'),
  ('2026-08-03', 38000, 'Alta stagione — agosto'),
  ('2026-08-04', 38000, 'Alta stagione — agosto'),
  ('2026-08-05', 38000, 'Alta stagione — agosto'),
  ('2026-08-06', 38000, 'Alta stagione — agosto'),
  ('2026-08-07', 38000, 'Alta stagione — agosto'),
  ('2026-12-24', 42000, 'Vigilia di Natale'),
  ('2026-12-25', 42000, 'Natale'),
  ('2026-12-31', 45000, 'Capodanno')
on conflict (date) do update set price_cents = excluded.price_cents, note = excluded.note;
