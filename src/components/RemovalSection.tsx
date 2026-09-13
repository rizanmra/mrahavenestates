import Image from "next/image";
import { PublicInboxLink } from "@/components/PublicInboxLink";
import { removalFeatures } from "@/data/site";
import { siteImages } from "@/data/hero-images";

export function RemovalSection() {
  return (
    <section className="border-t border-[color:var(--line)] px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="relative mb-16 aspect-[21/9] overflow-hidden">
          <Image
            src={siteImages.removals}
            alt="Professional removal services"
            fill
            className="object-cover"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--navy)]/90 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-10">
            <div className="flex justify-end">
              <PublicInboxLink
                href="/contact?reason=removals"
                className="btn-gold px-6 py-3 text-xs font-medium tracking-wide uppercase md:px-8 md:text-sm"
              >
                Get a quote
              </PublicInboxLink>
            </div>
            <div>
              <h2 className="font-display text-4xl text-white md:text-5xl">
                Removal &amp; relocation
              </h2>
              <p className="mt-4 max-w-md text-sm text-white/80">
                Licensed, insured, and trusted nationwide across the UK.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-12 md:grid-cols-3">
          {removalFeatures.map((feature, index) => (
            <div key={feature.title} className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--gold)]">
                <span className="font-display text-2xl text-[color:var(--gold)]">
                  {index + 1}
                </span>
              </div>
              <h3 className="font-display text-2xl text-white">
                {feature.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[color:var(--muted)]">
                {feature.description}
                {"link" in feature && feature.link ? (
                  <>
                    {" "}
                    <PublicInboxLink
                      href={feature.link}
                      className="text-[color:var(--gold)] underline underline-offset-4"
                    >
                      {feature.linkLabel}
                    </PublicInboxLink>
                    .
                  </>
                ) : null}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
