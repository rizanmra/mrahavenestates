import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs tracking-[0.28em] text-[color:var(--gold)] uppercase">
          The practice
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl">
          About MRA Haven Estates
        </h1>
        <div className="mt-8 space-y-6 text-lg leading-8 text-[color:var(--muted)]">
          <p>
            This is a custom website, not a Wix template. The client owns the
            code, the design can grow with the brand, and new pages do not
            depend on a website builder.
          </p>
          <p>
            The first version is a public brochure: homes, story, and a way to
            enquire. A listings dashboard, enquiry inbox, and domain can be
            added without starting over.
          </p>
        </div>
      </div>
    </section>
  );
}
