export type ImageSection =
  | "hero"
  | "master"
  | "double1"
  | "double2"
  | "twin"
  | "bathrooms"
  | "cucina"
  | "sala_da_pranzo"
  | "soggiorno"
  | "piscina"
  | "esterno"
  | "territorio"
  | "gallery"
  | "vini"
  | "cantine";

export type ImageRow = {
  id: string;
  section: ImageSection;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
};

export type WineRow = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  image_storage_path: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ActivityRow = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  image_storage_path: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SiteSettingsRow = {
  id: true;
  wine_section_enabled: boolean;
  activities_section_enabled: boolean;
  base_price_cents: number;
  min_stay_nights: number;
  cleaning_fee_cents: number;
  tourist_tax_cents_per_person_per_night: number;
  updated_at: string;
};

export type PricingCalendarRow = {
  date: string;
  price_cents: number;
  note: string | null;
  updated_at: string;
};

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "refunded";
export type SmoobuPushStatus = "not_pushed" | "pushed" | "failed";

export type BookingRow = {
  id: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  amount_cents: number;
  rental_cents: number | null;
  cleaning_fee_cents: number | null;
  tourist_tax_cents: number | null;
  currency: string;
  status: BookingStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  smoobu_reservation_id: string | null;
  smoobu_push_status: SmoobuPushStatus;
  locale: string;
  created_at: string;
  updated_at: string;
};

export type BlockedDateRow = {
  date: string;
  source: string;
  smoobu_reservation_id: string | null;
  synced_at: string;
};

export type SmoobuRateRow = {
  date: string;
  price_cents: number;
  synced_at: string;
};
