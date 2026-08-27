import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

type PageConfig = {
  title: string;
  description: string;
  heading: string;
  body: string[];
};

function makeInfoPage(config: PageConfig) {
  return function InfoPage() {
    return (
      <LegalPage title={config.heading}>
        {config.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </LegalPage>
    );
  };
}

export function createInfoPageMetadata(config: PageConfig): Metadata {
  return {
    title: config.title,
    description: config.description,
  };
}

export { makeInfoPage, type PageConfig };
