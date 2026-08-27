import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
