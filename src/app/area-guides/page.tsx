import type { Metadata } from "next";
import { InfoBody, PageImageHero } from "@/components/PageTemplate";
import { siteImages } from "@/data/hero-images";

const areas = [
  {
    name: "Bradford (BD1–BD9)",
    description:
      "City centre regeneration, excellent transport links, and strong demand from families and investors.",
  },
  {
    name: "Shipley (BD18)",
    description:
      "Popular with commuters to Leeds and Bradford. Good schools and Saltaire UNESCO village nearby.",
  },
  {
    name: "Bingley (BD16)",
    description:
      "Canal-side charm, five-rise locks, and a mix of period homes and modern developments.",
  },
  {
    name: "Keighley (BD21–BD22)",
    description:
      "Affordable family housing with access to the Yorkshire Dales and Airedale line rail services.",
  },
];

export const metadata: Metadata = {
  title: "Area Guides",
  description: "Area guides for neighbourhoods we serve nationwide across the UK.",
};

export default function AreaGuidesPage() {
  return (
    <>
      <PageImageHero
        title="Area Guides"
        subtitle="Discover neighbourhoods we serve nationwide across the UK."
        image={siteImages.areaGuides}
      />
      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
          {areas.map((area) => (
            <div key={area.name} className="gold-border p-8">
              <h2 className="font-display text-2xl text-white">{area.name}</h2>
              <p className="mt-4 text-sm leading-relaxed text-[color:var(--muted)]">
                {area.description}
              </p>
            </div>
          ))}
        </div>
      </section>
      <InfoBody cta={{ label: "Search properties", href: "/properties" }}>
        <p>
          Moving to a new area? Our team can advise on schools, transport,
          and street-by-street market trends nationwide across the UK. Contact
          us for a personalised area briefing.
        </p>
      </InfoBody>
    </>
  );
}
