import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { pages } from "@/data/page-content";

const content = pages["landlords/responsibilities"];

export const metadata: Metadata = {
  title: content.title,
  description: content.subtitle,
};

export default function Page() {
  return <ContentPage content={content} />;
}
