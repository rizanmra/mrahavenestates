import type { Metadata } from "next";
import { Suspense } from "react";
import { RedirectIfAdmin } from "@/components/RedirectIfAdmin";
import PropertyEnquiryForm from "./PropertyEnquiryForm";

export const metadata: Metadata = {
  title: "Property Enquiry",
};

export default function EnquirePage() {
  return (
    <Suspense
      fallback={
        <div className="page-offset px-6 py-16 text-[color:var(--muted)] lg:px-10">
          Loading…
        </div>
      }
    >
      <RedirectIfAdmin>
        <PropertyEnquiryForm />
      </RedirectIfAdmin>
    </Suspense>
  );
}
