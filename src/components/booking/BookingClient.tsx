"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BookingCalendar, type DateRange } from "@/components/booking/BookingCalendar";
import { PriceSummary, type StayQuote } from "@/components/booking/PriceSummary";
import { GuestForm, type GuestFormValues } from "@/components/booking/GuestForm";

export function BookingClient() {
  const t = useTranslations("booking");
  const locale = useLocale();

  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [guestsCount, setGuestsCount] = useState(2);
  const [quote, setQuote] = useState<StayQuote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/availability")
      .then((r) => r.json())
      .then((data) => setBlockedDates(new Set<string>(data.blockedDates ?? [])))
      .catch(() => setBlockedDates(new Set()));
  }, []);

  useEffect(() => {
    if (!range.from || !range.to) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing the stale quote when the range is cleared
      setQuote(null);
      return;
    }
    fetch(`/api/pricing?checkIn=${range.from}&checkOut=${range.to}&guestsCount=${guestsCount}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setQuote(null);
          return;
        }
        setQuote(data as StayQuote);
      })
      .catch(() => setQuote(null));
  }, [range.from, range.to, guestsCount]);

  async function handleSubmit(values: GuestFormValues) {
    if (!range.from || !range.to || !quote?.meetsMinStay) return;
    setSubmitting(true);
    setErrorKey(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn: range.from,
          checkOut: range.to,
          guestsCount: values.guestsCount,
          guestName: values.guestName,
          guestEmail: values.guestEmail,
          guestPhone: values.guestPhone || undefined,
          locale,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503) setErrorKey("notConfigured");
        else if (res.status === 409) setErrorKey("unavailable");
        else setErrorKey("generic");
        setSubmitting(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setErrorKey("generic");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
      <BookingCalendar
        blockedDates={blockedDates}
        range={range}
        onChange={setRange}
        labels={{
          checkIn: t("calendar.checkIn"),
          checkOut: t("calendar.checkOut"),
          selectPrompt: t("calendar.selectPrompt"),
          legend: t("calendar.legend"),
        }}
      />

      <div className="space-y-6">
        <PriceSummary quote={quote} guestsCount={guestsCount} />
        <GuestForm
          guestsCount={guestsCount}
          onGuestsCountChange={setGuestsCount}
          onSubmit={handleSubmit}
          submitting={submitting}
          disabled={!range.from || !range.to || !quote?.meetsMinStay}
        />
        {errorKey && <p className="text-sm text-charcoal">{t(`errors.${errorKey}`)}</p>}
      </div>
    </div>
  );
}
