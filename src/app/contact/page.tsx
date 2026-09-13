import type { Metadata } from "next";
import { Suspense } from "react";
import { RedirectIfAdmin } from "@/components/RedirectIfAdmin";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <RedirectIfAdmin>
      <Suspense
        fallback={
          <div className="page-offset px-6 py-16 text-[color:var(--muted)] lg:px-10">
            Loading…
          </div>
        }
      >
        <ContactForm />
      </Suspense>
    </RedirectIfAdmin>
  );
}
