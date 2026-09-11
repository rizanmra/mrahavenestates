import type { Metadata } from "next";
import { AccountPortal } from "./AccountPortal";

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your MRA Haven Estates client portal.",
};

export default function AccountPage() {
  return <AccountPortal />;
}
