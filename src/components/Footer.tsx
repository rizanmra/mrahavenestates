import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[color:var(--line)] bg-[color:var(--ink)] text-[color:var(--cream)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-3">
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl tracking-[0.16em]">
            MRA Haven Estates
          </p>
          <p className="mt-3 max-w-sm text-sm leading-7 text-[color:var(--cream-dim)]">
            A custom property website. Listings, enquiries, and the client
            domain will be connected as the project grows.
          </p>
        </div>
        <div>
          <p className="text-xs tracking-[0.22em] uppercase text-[color:var(--gold)]">
            Visit
          </p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-[color:var(--cream-dim)]">
            <Link href="/properties">Properties</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <p className="text-xs tracking-[0.22em] uppercase text-[color:var(--gold)]">
            Office
          </p>
          <p className="mt-4 text-sm leading-7 text-[color:var(--cream-dim)]">
            By appointment
            <br />
            hello@mraheavenestates.com
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-center text-xs tracking-[0.14em] text-[color:var(--cream-dim)] uppercase">
        © {new Date().getFullYear()} MRA Haven Estates
      </div>
    </footer>
  );
}
