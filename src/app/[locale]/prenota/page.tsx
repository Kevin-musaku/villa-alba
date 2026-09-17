import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookingClient } from "@/components/booking/BookingClient";

export default async function PrenotaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("booking");

  return (
    <section className="px-6 py-32 md:px-10 md:py-40">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-stone">{t("kicker")}</p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-ink md:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-graphite md:text-base">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-16">
          <BookingClient />
        </div>
      </div>
    </section>
  );
}
