import Image from "next/image";
import Link from "next/link";
import { services } from "@/data/site";

export function ServiceCards() {
  return (
    <section className="px-6 py-24 lg:px-10">
      <div className="mx-auto grid max-w-7xl items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {services.map((service) => (
          <div
            key={service.title}
            className="gold-border group flex h-full flex-col overflow-hidden"
          >
            {service.image ? (
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--navy)] to-transparent" />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col p-6 text-center xl:p-5">
              <h3 className="font-display text-3xl text-white xl:text-[1.7rem]">
                {service.title}
              </h3>
              <div className="gold-line my-6" />
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
          </div>
        ))}
      </div>
    </section>
  );
}
