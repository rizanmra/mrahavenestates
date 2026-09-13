import Image from "next/image";
import type { ReactNode } from "react";
import { PublicInboxLink } from "@/components/PublicInboxLink";

export function PageImageHero({
  title,
  subtitle,
  image,
}: {
  title: string;
  subtitle?: string;
  image: string;
}) {
  return (
    <section className="page-offset relative min-h-[40vh] overflow-hidden">
      <Image
        src={image}
        alt=""
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--navy)] via-[color:var(--navy)]/70 to-[color:var(--navy)]/40" />
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 text-center lg:px-10">
        <h1 className="font-display text-5xl text-white md:text-6xl">{title}</h1>
        {subtitle ? (
          <p className="mt-6 text-lg text-white/85">{subtitle}</p>
        ) : null}
      </div>
    </section>
  );
}

export function PageHero({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="page-offset border-b border-[color:var(--line)] bg-[color:var(--navy-light)] px-6 pb-20 lg:px-10">
      <div className="mx-auto max-w-4xl pt-6 text-center">
        <h1 className="font-display text-5xl text-white md:text-6xl">{title}</h1>
        {subtitle ? (
          <p className="mt-6 text-lg text-[color:var(--muted)]">{subtitle}</p>
        ) : null}
      </div>
    </section>
  );
}

export function InfoBody({
  children,
  cta,
  bullets,
  align = "left",
}: {
  children: ReactNode;
  cta?: { label: string; href: string };
  bullets?: string[];
  align?: "left" | "center";
}) {
  return (
    <section className="px-6 py-16 lg:px-10">
      <div
        className={`mx-auto max-w-3xl space-y-6 text-lg leading-relaxed text-[color:var(--muted)] ${
          align === "center" ? "text-center" : ""
        }`}
      >
        {children}
        {bullets && bullets.length > 0 ? (
          <ul
            className={`space-y-3 pt-2 ${
              align === "center" ? "mx-auto inline-block text-left" : ""
            }`}
          >
            {bullets.map((item) => (
              <li key={item} className="flex gap-3">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--gold)]"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {cta ? (
          <PublicInboxLink
            href={cta.href}
            className="btn-gold mt-8 inline-block px-8 py-3 text-sm uppercase"
          >
            {cta.label}
          </PublicInboxLink>
        ) : null}
      </div>
    </section>
  );
}
