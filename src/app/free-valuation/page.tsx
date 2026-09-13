import type { Metadata } from "next";
import FreeValuationForm from "./FreeValuationForm";

export const metadata: Metadata = {
  title: "Free Valuation",
  description:
    "Find the latest HM Land Registry sold price for a UK property address, then unlock your figure with a valid email.",
};

export default function FreeValuationPage() {
  return <FreeValuationForm />;
}
