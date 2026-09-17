"use client";

import { useTranslations, useLocale } from "next-intl";

export type StayQuote = {
  nights: { date: string; priceCents: number }[];
  rentalCents: number;
  cleaningFeeCents: number;
  touristTaxCents: number;
  totalCents: number;
  currency: string;
  minStayNights: number;
  meetsMinStay: boolean;
};

export function PriceSummary({
  quote,
  guestsCount,
}: {
  quote: StayQuote | null;
  guestsCount: number;
}) {
  const t = useTranslations("booking.summary");
  const locale = useLocale();

  const format = (cents: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: quote?.currency ?? "EUR" }).format(
      cents / 100
    );

  if (!quote) return null;

  return (
    <div className="rounded-[var(--radius-lg)] border border-mist bg-white p-6 shadow-[var(--shadow-sm)]">
      <h3 className="font-display text-lg text-ink">{t("title")}</h3>

      <ul className="mt-4 space-y-1 text-sm text-graphite">
        {quote.nights.map((n) => (
          <li key={n.date} className="flex justify-between">
            <span>{n.date}</span>
            <span>{format(n.priceCents)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-2 border-t border-mist pt-4 text-sm">
        <div className="flex justify-between text-stone">
          <span>{t("nightsLabel")}</span>
          <span>{quote.nights.length}</span>
        </div>
        <div className="flex justify-between text-graphite">
          <span>{t("rentalSubtotalLabel")}</span>
          <span>{format(quote.rentalCents)}</span>
        </div>
        {quote.cleaningFeeCents > 0 && (
          <div className="flex justify-between text-graphite">
            <span>{t("cleaningFeeLabel")}</span>
            <span>{format(quote.cleaningFeeCents)}</span>
          </div>
        )}
        {quote.touristTaxCents > 0 && (
          <div className="flex justify-between text-graphite">
            <span>
              {t("touristTaxLabel")}
              <span className="block text-xs text-stone">
                {t("touristTaxDetail", { guests: guestsCount, nights: quote.nights.length })}
              </span>
            </span>
            <span>{format(quote.touristTaxCents)}</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between border-t border-mist pt-4 font-display text-xl text-ink">
        <span>{t("totalLabel")}</span>
        <span>{format(quote.totalCents)}</span>
      </div>

      {!quote.meetsMinStay && (
        <p className="mt-4 text-xs text-charcoal">
          {t("minStayNotice", { min: quote.minStayNights })}
        </p>
      )}
    </div>
  );
}
