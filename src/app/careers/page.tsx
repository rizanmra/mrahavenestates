import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { jobListings } from "@/data/careers";
import { siteImages } from "@/data/hero-images";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the MRA Haven Estates team in Bradford.",
};

export default function CareersPage() {
  return (
    <>
      <section className="relative min-h-[40vh] overflow-hidden pt-28">
        <Image
          src={siteImages.careers}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--navy)] via-[color:var(--navy)]/70 to-[color:var(--navy)]/40" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 text-center lg:px-10">
          <h1 className="font-display text-5xl text-white md:text-6xl">Careers</h1>
          <p className="mt-6 text-lg text-white/85">
            Build your career with a growing estate agency rooted in Bradford.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-3xl space-y-8">
          <p className="text-lg leading-relaxed text-[color:var(--muted)]">
            We are always looking for passionate people who love property and
            exceptional customer service. Explore our current openings below.
          </p>

          {jobListings.map((job) => (
            <div key={job.title} className="gold-border p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h2 className="font-display text-2xl text-white">{job.title}</h2>
                <span className="text-sm text-[color:var(--gold)]">
                  {job.type}
                </span>
              </div>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                {job.location}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[color:var(--muted)]">
                {job.description}
              </p>
            </div>
          ))}

          <Link
            href="/contact"
            className="btn-gold inline-block px-8 py-3 text-sm uppercase"
          >
            Apply now
          </Link>
        </div>
      </section>
    </>
  );
}
