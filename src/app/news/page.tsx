import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { newsArticles } from "@/data/news";
import { siteImages } from "@/data/hero-images";

export const metadata: Metadata = {
  title: "News",
  description: "Property insights and news from MRA Haven Estates.",
};

export default function NewsPage() {
  return (
    <>
      <section className="page-offset relative min-h-[40vh] overflow-hidden">
        <Image
          src={siteImages.news}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--navy)] via-[color:var(--navy)]/70 to-[color:var(--navy)]/40" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 text-center lg:px-10">
          <h1 className="font-display text-5xl text-white md:text-6xl">
            Property Insights &amp; News
          </h1>
          <p className="mt-6 text-lg text-white/85">
            Market updates, moving tips, and local property news from our experts.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
          {newsArticles.map((article) => (
            <article
              key={article.slug}
              className="gold-border group overflow-hidden"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={article.image}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-8">
                <time className="text-xs tracking-widest text-[color:var(--gold)] uppercase">
                  {article.date}
                </time>
                <h2 className="font-display mt-3 text-2xl text-white group-hover:text-[color:var(--gold)]">
                  {article.title}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-[color:var(--muted)]">
                  {article.excerpt}
                </p>
                <Link
                  href="/contact?reason=general"
                  className="mt-6 inline-block text-sm text-[color:var(--gold)] hover:underline"
                >
                  Contact us about this topic
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
