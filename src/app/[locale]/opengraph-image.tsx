import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

export const alt = "Villa Alba — Franciacorta";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px 96px",
          background: "#14171c",
          color: "#f5f3ef",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#a9a196",
            display: "flex",
          }}
        >
          Franciacorta
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 96,
            fontWeight: 600,
            display: "flex",
          }}
        >
          Villa Alba
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            maxWidth: 900,
            color: "#d8d3ca",
            display: "flex",
          }}
        >
          {t("description")}
        </div>
      </div>
    ),
    { ...size }
  );
}
