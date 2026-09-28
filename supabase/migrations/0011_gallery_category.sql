-- Villa Alba — categoria per le foto della sezione Galleria (home).
--
-- La galleria in home mostra un'etichetta per ogni foto ("La Villa", "I
-- Vigneti", "Il Lago", "Le Cantine"): finora questa etichetta veniva
-- assegnata a rotazione in base alla posizione della foto (prima e seconda
-- = villa, terza e quarta = vigneti, ...), presa da un elenco di segnaposto
-- fisso — non da una scelta reale dell'admin. Appena si caricano foto vere
-- l'etichetta mostrata sul sito non corrisponde più al contenuto della
-- foto. Questa colonna permette all'admin di scegliere la categoria giusta
-- per ogni foto caricata.

alter table public.images
  add column gallery_category text
  check (gallery_category in ('villa', 'vigneti', 'lago', 'cantine'));
