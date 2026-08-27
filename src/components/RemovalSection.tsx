import Image from "next/image";
import Link from "next/link";
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
          <div className="absolute inset-0 flex items-center px-8 md:px-16">
            <div>
              <h2 className="font-display text-4xl text-white md:text-5xl">
                Removal &amp; relocation
              </h2>
              <p className="mt-4 max-w-md text-sm text-white/80">
                Licensed, insured, and trusted across Bradford and West Yorkshire.
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
                    <Link
                      href={feature.link}
                      className="text-[color:var(--gold)] underline underline-offset-4"
                    >
                      {feature.linkLabel}
                    </Link>
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
