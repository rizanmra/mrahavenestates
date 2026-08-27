import Image from "next/image";
import Link from "next/link";
import type { PageContent } from "@/data/page-content";

export function ContentPage({ content }: { content: PageContent }) {
  return (
    <>
      <section className="relative min-h-[42vh] overflow-hidden pt-28">
        {content.image ? (
          <>
            <Image
              src={content.image}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--navy)] via-[color:var(--navy)]/70 to-[color:var(--navy)]/40" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[color:var(--navy-light)]" />
        )}
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 text-center lg:px-10">
          <h1 className="font-display text-5xl text-white md:text-6xl">
            {content.title}
          </h1>
          {content.subtitle ? (
            <p className="mt-6 text-lg text-white/85">{content.subtitle}</p>
          ) : null}
        </div>
      </section>

      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-3xl space-y-6 text-lg leading-relaxed text-[color:var(--muted)]">
          {content.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}

          {content.bullets && content.bullets.length > 0 ? (
            <ul className="space-y-3 pt-2">
              {content.bullets.map((item) => (
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

          {content.cta ? (
            <Link
              href={content.cta.href}
              className="btn-gold mt-8 inline-block px-8 py-3 text-sm uppercase"
            >
              {content.cta.label}
            </Link>
          ) : null}
        </div>
      </section>
    </>
  );
}
