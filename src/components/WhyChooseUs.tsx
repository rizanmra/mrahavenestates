import { whyChooseUs, whyChooseUsIntro } from "@/data/site";

export function WhyChooseUs() {
  return (
    <section className="border-t border-[color:var(--line)] px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="font-display text-4xl text-white md:text-5xl">
            Why choose MRA Haven Estates?
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[color:var(--muted)]">
            {whyChooseUsIntro}
          </p>
        </div>
        <ul className="mt-12 space-y-4 lg:mt-0">
          {whyChooseUs.map((item) => (
            <li
              key={item}
              className="flex items-start gap-4 border-b border-[color:var(--line)] pb-4 text-white"
            >
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[color:var(--gold)]" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
