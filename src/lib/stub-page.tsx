import type { Metadata } from "next";
import { InfoBody, PageHero } from "@/components/PageTemplate";

type StubPageProps = {
  title: string;
  description?: string;
};

export function makeStubPage({ title, description }: StubPageProps) {
  const metadata: Metadata = { title, description };

  function StubPage() {
    return (
      <>
        <PageHero title={title} subtitle={description} />
        <InfoBody cta={{ label: "Contact us", href: "/contact" }}>
          <p>Full content for this section is coming soon. Contact our team for immediate help.</p>
        </InfoBody>
      </>
    );
  }

  return { metadata, StubPage };
}
