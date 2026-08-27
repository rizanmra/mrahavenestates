import type { Metadata } from "next";
import FreeValuationForm from "./FreeValuationForm";

export const metadata: Metadata = {
  title: "Free Valuation",
  description:
    "Book a free, no-obligation property valuation with MRA Haven Estates.",
};

export default function FreeValuationPage() {
  return <FreeValuationForm />;
}
