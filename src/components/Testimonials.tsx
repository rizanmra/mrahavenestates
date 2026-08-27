import { testimonials } from "@/data/site";

export function Testimonials() {
  const featured = testimonials[0];

  return (
    <section className="border-t border-[color:var(--line)] px-6 py-24 lg:px-10" id="testimonials">
      <div className="mx-auto max-w-4xl text-center">
        <blockquote className="font-display text-2xl leading-relaxed text-white md:text-3xl lg:text-4xl">
          &ldquo;{featured.quote}&rdquo;
        </blockquote>
      </div>

      <div className="mx-auto mt-16 max-w-5xl space-y-0">
        {testimonials.map((item) => (
          <div
            key={item.name}
            className="grid gap-6 border-t border-[color:var(--line)] py-8 md:grid-cols-2 md:gap-12"
          >
            <div>
              <p className="font-medium text-white">{item.name}</p>
              <p className="text-sm text-[color:var(--muted)]">{item.role}</p>
            </div>
            <p className="text-sm leading-relaxed text-[color:var(--muted)]">
              &ldquo;{item.quote}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
