import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function GraziePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("grazie");

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6 py-32 text-center">
      <div className="max-w-xl">
        <h1 className="font-display text-4xl text-ink md:text-5xl">{t("title")}</h1>
        <p className="mt-6 text-sm leading-relaxed text-graphite md:text-base">{t("message")}</p>
        <Link
          href="/"
          className="mt-10 inline-block border border-ink px-7 py-3 text-xs uppercase tracking-[0.25em] text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          {t("backHome")}
        </Link>
      </div>
    </section>
  );
}
