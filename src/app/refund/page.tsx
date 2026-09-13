import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: `Refund and cancellation information for ${site.name} services.`,
};

export default function RefundPage() {
  return (
    <LegalPage title="Refund Policy">
      <p>
        This policy covers fees and deposits paid to {site.name} for services
        such as removals bookings, valuations where a fee applies, and other
        paid instructions. Estate agency and lettings fees in a signed agreement
        take priority over this page if they differ.
      </p>
      <h2 className="pt-4 font-display text-2xl text-white">
        How refunds work
      </h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="text-white">Services not yet started</strong> —
          unused prepaid fees may be refunded in full if you cancel in writing
          before work begins.
        </li>
        <li>
          <strong className="text-white">Part-completed work</strong> — we may
          retain a fair amount for time and costs already incurred, and refund
          the balance where applicable.
        </li>
        <li>
          <strong className="text-white">Completed services</strong> — fees for
          work already delivered are not normally refundable.
        </li>
        <li>
          <strong className="text-white">Statutory rights</strong> — nothing in
          this policy affects your rights under UK consumer law.
        </li>
      </ul>
      <h2 className="pt-4 font-display text-2xl text-white">How to request</h2>
      <p>
        Email{" "}
        <a href={`mailto:${site.email}`} className="text-[color:var(--gold)]">
          {site.email}
        </a>{" "}
        with your name, booking or invoice reference, and reason for the
        request, or use{" "}
        <Link href="/contact?reason=general" className="text-[color:var(--gold)]">
          Contact us
        </Link>
        . Approved refunds are usually returned to the original payment method
        within 14 working days.
      </p>
      <p>Last reviewed: September 2026.</p>
    </LegalPage>
  );
}
