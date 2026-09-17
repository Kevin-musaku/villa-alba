-- Villa Alba — slot immagini per singola stanza (al posto delle sezioni generiche)
-- Nessuna riga esistente in "images" al momento di questa migration (verificato),
-- quindi il vincolo può essere sostituito senza migrazione dati.

alter table public.images drop constraint if exists images_section_check;

alter table public.images add constraint images_section_check check (section in (
  'hero',
  'master', 'double1', 'double2', 'twin', 'bathrooms',
  'cucina', 'sala_da_pranzo', 'soggiorno', 'piscina', 'esterno',
  'territorio', 'gallery', 'vini', 'cantine'
));
