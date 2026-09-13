import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description: `Accessibility information for the ${site.name} website.`,
};

export default function AccessibilityPage() {
  return (
    <LegalPage title="Accessibility Statement">
      <p>
        {site.name} wants everyone to be able to use our website, including
        people who use assistive technologies.
      </p>
      <h2 className="pt-4 font-display text-2xl text-white">
        What we aim to provide
      </h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Clear page titles and headings</li>
        <li>Text that can be resized in the browser</li>
        <li>Links and buttons that can be used with a keyboard</li>
        <li>Colour contrast that supports readable text</li>
        <li>Alternative text on meaningful images where practical</li>
      </ul>
      <h2 className="pt-4 font-display text-2xl text-white">Known limits</h2>
      <p>
        Some third-party embeds, maps or older media may not meet every
        accessibility guideline. We improve these when we update the site.
      </p>
      <h2 className="pt-4 font-display text-2xl text-white">Feedback</h2>
      <p>
        If you find a barrier or need information in another format, please tell
        us:
      </p>
      <p>
        Email:{" "}
        <a href={`mailto:${site.email}`} className="text-[color:var(--gold)]">
          {site.email}
        </a>
        <br />
        Phone:{" "}
        <a href={site.phoneHref} className="text-[color:var(--gold)]">
          {site.phone}
        </a>
        <br />
        Or use our{" "}
        <Link href="/contact?reason=general" className="text-[color:var(--gold)]">
          Contact
        </Link>{" "}
        form.
      </p>
      <p>We aim to reply within five working days. Last reviewed: September 2026.</p>
    </LegalPage>
  );
}
