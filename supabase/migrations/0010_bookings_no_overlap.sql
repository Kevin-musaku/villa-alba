-- Villa Alba — impedisce le prenotazioni sovrapposte a livello di database.
--
-- Il controllo disponibilità in /api/checkout (isRangeAvailable) legge le
-- prenotazioni esistenti e poi inserisce la nuova: è un pattern
-- "check-then-insert" che non è atomico. Due richieste quasi simultanee per
-- le stesse date possono entrambe superare il controllo e finire entrambe
-- inserite come "pending", generando un doppio booking reale (e un doppio
-- incasso) se entrambe arrivano poi a pagamento su Stripe.
--
-- Un exclusion constraint fa rispettare il vincolo direttamente al momento
-- dell'INSERT/UPDATE, in modo atomico sotto concorrenza — cosa che nessun
-- controllo fatto in applicazione può garantire. Il WHERE lo applica solo
-- alle prenotazioni che occupano davvero una data (pending/confirmed):
-- cancelled/refunded possono restare sovrapposte a un'altra prenotazione
-- senza problemi.

alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    daterange(check_in, check_out, '[)') with &&
  )
  where (status in ('pending', 'confirmed'));
