import { getTranslations } from "next-intl/server";
import { getAllVillaRoomImages } from "@/lib/content/images";
import { LaVillaPanels, type VillaPanelData } from "./LaVillaPanels";

export async function LaVilla() {
  const t = await getTranslations("villa");
  const images = await getAllVillaRoomImages();

  const panels: VillaPanelData[] = [
    { key: "master", image: images.master, title: t("rooms.master.name"), description: t("rooms.master.description") },
    { key: "double1", image: images.double1, title: t("rooms.double1.name"), description: t("rooms.double1.description") },
    { key: "double2", image: images.double2, title: t("rooms.double2.name"), description: t("rooms.double2.description") },
    { key: "twin", image: images.twin, title: t("rooms.twin.name"), description: t("rooms.twin.description") },
    { key: "bathrooms", image: images.bathrooms, title: t("bathrooms.title"), description: t("bathrooms.description") },
    { key: "cucina", image: images.cucina, title: t("cucina.title"), description: t("cucina.description") },
    { key: "sala_da_pranzo", image: images.sala_da_pranzo, title: t("salaDaPranzo.title"), description: t("salaDaPranzo.description") },
    { key: "soggiorno", image: images.soggiorno, title: t("soggiorno.title"), description: t("soggiorno.description") },
    { key: "piscina", image: images.piscina, title: t("piscina.title"), description: t("piscina.description") },
    { key: "esterno", image: images.esterno, title: t("esterno.title"), description: t("esterno.description") },
  ];

  const amenities = t.raw("amenities.items") as string[];

  return (
    <section id="villa" className="bg-paper px-6 py-28 md:px-10 md:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="mb-20 max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-graphite">
            {t("kicker")}
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-ink md:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-graphite md:text-base">{t("intro")}</p>
        </div>

        <LaVillaPanels panels={panels} amenitiesTitle={t("amenities.title")} amenities={amenities} />
      </div>
    </section>
  );
}
