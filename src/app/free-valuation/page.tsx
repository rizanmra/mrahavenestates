import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Property Value Calculator",
};

/** Past-sales Market Value tool retired — use £/m² calculator instead. */
export default function FreeValuationPage() {
  redirect("/property-value-calculator");
}
