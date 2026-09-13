import type { Metadata } from "next";
import Link from "next/link";
import { InfoBody, PageHero } from "@/components/PageTemplate";

export const metadata: Metadata = {
  title: "Buy at Auction",
  description:
    "Auction interest for buyers — contact MRA Haven Estates or browse current rentals.",
};

export default function BuyAuctionPage() {
  return (
    <>
      <PageHero
        title="Buy at Auction"
        subtitle="Tell us what you are looking for — or browse our rental listings."
      />
      <InfoBody
        cta={{
          label: "Contact us about auction",
          href: "/contact?reason=auction",
        }}
      >
        <p>
          If you want to buy at auction, get in touch and our team will advise
          on the next steps. We do not publish a live auction catalogue for
          buyers on this website.
        </p>
        <p>
          Looking for a home to rent in the meantime?{" "}
          <Link
            href="/properties?type=rent"
            className="text-[color:var(--gold)]"
          >
            Browse properties to rent
          </Link>
          .
        </p>
      </InfoBody>
    </>
  );
}
