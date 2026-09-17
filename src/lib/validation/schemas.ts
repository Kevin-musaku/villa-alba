import { z } from "zod";

export const BookingRequestSchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guestsCount: z.number().int().min(1).max(8),
  guestName: z.string().min(2).max(120),
  guestEmail: z.string().email(),
  guestPhone: z.string().max(40).optional(),
  locale: z.enum(["it", "en", "de", "es", "fr"]).default("it"),
});
export type BookingRequest = z.infer<typeof BookingRequestSchema>;

export const WineInputSchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().max(2000).optional().default(""),
  priceCents: z.number().int().min(0),
  isActive: z.boolean().default(true),
  imageStoragePath: z.string().url().nullable().optional(),
  sortOrder: z.number().int().default(0),
});
export type WineInput = z.infer<typeof WineInputSchema>;

export const SiteSettingsInputSchema = z.object({
  wineSectionEnabled: z.boolean().optional(),
  activitiesSectionEnabled: z.boolean().optional(),
  basePriceCents: z.number().int().min(0).optional(),
  minStayNights: z.number().int().min(1).optional(),
  cleaningFeeCents: z.number().int().min(0).optional(),
  touristTaxCentsPerPersonPerNight: z.number().int().min(0).optional(),
});

export const PriceOverrideInputSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
  priceCents: z.number().int().min(0).nullable(),
  note: z.string().max(200).optional(),
});

export const ImageInputSchema = z.object({
  section: z.enum([
    "hero",
    "master",
    "double1",
    "double2",
    "twin",
    "bathrooms",
    "cucina",
    "sala_da_pranzo",
    "soggiorno",
    "piscina",
    "esterno",
    "territorio",
    "gallery",
    "vini",
    "cantine",
  ]),
  storagePath: z.string().url(),
  altText: z.string().max(300).optional(),
  sortOrder: z.number().int().default(0),
});

export const ReorderInputSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});
