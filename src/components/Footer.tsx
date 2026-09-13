"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { NewsletterForm } from "@/components/NewsletterForm";
import { legalLinks, site } from "@/data/site";

function SocialIcon({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-[color:var(--gold)] hover:text-[color:var(--navy)]"
    >
      <span className="text-xs font-bold">{label[0]}</span>
    </a>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--line)] bg-[color:var(--navy)]">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-3 lg:px-10">
        <div>
          <BrandLogo href="/" size="footer" showWordmark />
          <h2 className="font-display mt-8 text-3xl text-white">
            Connect with Us
          </h2>
          <div className="mt-8">
            <NewsletterForm />
          </div>
        </div>

        <div>
          <a
            href={site.phoneHref}
            className="block text-white hover:text-[color:var(--gold)]"
          >
            {site.phone}
          </a>
          <a
            href={`mailto:${site.email}`}
            className="mt-2 block text-white hover:text-[color:var(--gold)]"
          >
            {site.email}
          </a>
          <address className="mt-6 not-italic text-sm leading-relaxed text-[color:var(--muted)]">
            {site.address.line1}
            <br />
            {site.address.line2}
            <br />
            {site.address.city}
            <br />
            {site.address.postcode}
          </address>
          {Object.entries(site.social).some(([, href]) => href) ? (
            <div className="mt-6 flex gap-3">
              {site.social.facebook ? (
                <SocialIcon label="Facebook" href={site.social.facebook} />
              ) : null}
              {site.social.instagram ? (
                <SocialIcon label="Instagram" href={site.social.instagram} />
              ) : null}
              {site.social.x ? (
                <SocialIcon label="X" href={site.social.x} />
              ) : null}
              {site.social.tiktok ? (
                <SocialIcon label="TikTok" href={site.social.tiktok} />
              ) : null}
            </div>
          ) : null}
        </div>

        <div>
          <nav className="flex flex-col gap-3">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white hover:text-[color:var(--gold)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="mt-12 text-sm text-[color:var(--muted)]">
            © {new Date().getFullYear()} by {site.name}.
          </p>
        </div>
      </div>
    </footer>
  );
}
