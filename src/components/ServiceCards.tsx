import Link from "next/link";
import { services } from "@/data/site";

export function ServiceCards() {
  return (
    <section className="px-6 py-24 lg:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
        {services.map((service) => (
          <div
            key={service.title}
            className="gold-border flex flex-col p-8 text-center"
          >
            <h3 className="font-display text-4xl text-white">{service.title}</h3>
            <div className="gold-line my-6" />
            <p className="text-2xl text-white">{service.price}</p>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-[color:var(--muted)]">
              {service.description}
            </p>
            <Link
              href={service.href}
              className="btn-gold mt-8 inline-block px-8 py-3 text-sm font-medium"
            >
              {service.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
