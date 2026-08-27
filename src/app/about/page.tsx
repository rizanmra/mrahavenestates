import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="pt-28">
      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-5xl text-white md:text-6xl">
            About MRA Haven Estates
          </h1>
          <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--muted)]">
            <p>
              MRA Haven Estates is a trusted estate agent serving Bradford and
              West Yorkshire. We help buyers, sellers, landlords and tenants
              move with confidence.
            </p>
            <p>
              From premium property marketing and managed lettings to licensed
              removals and free valuations, we offer a complete moving solution
              under one roof.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
