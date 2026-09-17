"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { PHONE_CODES, DEFAULT_PHONE_CODE } from "@/lib/phone-codes";

const GuestFormSchema = z.object({
  guestName: z.string().min(2).max(120),
  guestEmail: z.string().email(),
  phonePrefix: z.string(),
  guestPhoneNumber: z.string().max(30).optional().or(z.literal("")),
});

export type GuestFormValues = {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestsCount: number;
};

type GuestFormInput = z.input<typeof GuestFormSchema>;
type GuestFormParsed = z.output<typeof GuestFormSchema>;

export function GuestForm({
  guestsCount,
  onGuestsCountChange,
  onSubmit,
  submitting,
  disabled,
}: {
  guestsCount: number;
  onGuestsCountChange: (value: number) => void;
  onSubmit: (values: GuestFormValues) => void;
  submitting: boolean;
  disabled: boolean;
}) {
  const t = useTranslations("booking.form");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestFormInput, unknown, GuestFormParsed>({
    resolver: zodResolver(GuestFormSchema),
    defaultValues: { phonePrefix: DEFAULT_PHONE_CODE },
  });

  function handleValidSubmit(values: GuestFormParsed) {
    const number = values.guestPhoneNumber?.trim();
    onSubmit({
      guestName: values.guestName,
      guestEmail: values.guestEmail,
      guestPhone: number ? `${values.phonePrefix} ${number}` : "",
      guestsCount,
    });
  }

  return (
    <form
      onSubmit={handleSubmit(handleValidSubmit)}
      className="space-y-4 rounded-[var(--radius-lg)] border border-mist bg-white p-6 shadow-[var(--shadow-sm)]"
    >
      <div>
        <label className="block text-xs uppercase tracking-[0.12em] text-stone">
          {t("nameLabel")}
        </label>
        <input
          {...register("guestName")}
          className="mt-2 w-full rounded-[var(--radius-sm)] border border-mist bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-ink"
        />
        {errors.guestName && <p className="mt-1 text-xs text-charcoal">{errors.guestName.message}</p>}
      </div>

      <div>
        <label className="block text-xs uppercase tracking-[0.12em] text-stone">
          {t("emailLabel")}
        </label>
        <input
          type="email"
          {...register("guestEmail")}
          className="mt-2 w-full rounded-[var(--radius-sm)] border border-mist bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-ink"
        />
        {errors.guestEmail && <p className="mt-1 text-xs text-charcoal">{errors.guestEmail.message}</p>}
      </div>

      <div>
        <label className="block text-xs uppercase tracking-[0.12em] text-stone">
          {t("phoneLabel")}
        </label>
        <div className="mt-2 flex gap-2">
          <select
            {...register("phonePrefix")}
            className="w-28 shrink-0 rounded-[var(--radius-sm)] border border-mist bg-paper px-2 py-2 text-sm text-ink outline-none transition-colors focus:border-ink"
          >
            {PHONE_CODES.map((c) => (
              <option key={c.iso2} value={c.dialCode}>
                {c.flag} {c.iso2} {c.dialCode}
              </option>
            ))}
          </select>
          <input
            type="tel"
            {...register("guestPhoneNumber")}
            className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-mist bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-ink"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-[0.12em] text-stone">
          {t("guestsLabel")}
        </label>
        <select
          value={guestsCount}
          onChange={(e) => onGuestsCountChange(Number(e.target.value))}
          className="mt-2 w-full rounded-[var(--radius-sm)] border border-mist bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-ink"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-stone">{t("guestsHint")}</p>
      </div>

      <button
        type="submit"
        disabled={disabled || submitting}
        className="font-mono w-full rounded-[var(--radius-sm)] bg-ink px-6 py-3.5 text-[11px] uppercase tracking-[0.15em] text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-graphite hover:shadow-[var(--shadow-md)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {submitting ? t("redirecting") : t("submitCta")}
      </button>
    </form>
  );
}
