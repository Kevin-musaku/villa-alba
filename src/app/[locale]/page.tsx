import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";
import { LaVilla } from "@/components/sections/LaVilla";
import { Territorio } from "@/components/sections/Territorio";
import { Vini } from "@/components/sections/Vini";
import { Activities } from "@/components/sections/Activities";
import { Gallery } from "@/components/sections/Gallery";
import { HouseRules } from "@/components/sections/HouseRules";
import { getGalleryImages, getHeroImage } from "@/lib/content/images";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [galleryItems, heroImage] = await Promise.all([getGalleryImages(), getHeroImage()]);

  return (
    <>
      <Hero image={heroImage} />
      <LaVilla />
      <Territorio />
      <Vini />
      <Activities />
      <Gallery items={galleryItems} />
      <HouseRules />
    </>
  );
}
