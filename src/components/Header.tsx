"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/properties", label: "Properties" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--line)] bg-[color:var(--cream)]/92 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-[family-name:var(--font-display)] text-xl tracking-[0.18em] text-[color:var(--ink)]">
            MRA
          </span>
          <span className="mt-1 text-[10px] tracking-[0.32em] text-[color:var(--muted)] uppercase">
            Haven Estates
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm tracking-[0.12em] uppercase transition-colors ${
                  active
                    ? "text-[color:var(--ink)]"
                    : "text-[color:var(--muted)] hover:text-[color:var(--ink)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/contact"
            className="rounded-full bg-[color:var(--ink)] px-4 py-2 text-xs tracking-[0.16em] text-[color:var(--cream)] uppercase"
          >
            Enquire
          </Link>
        </nav>

        <button
          type="button"
          className="md:hidden text-sm tracking-[0.16em] uppercase text-[color:var(--ink)]"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <nav className="border-t border-[color:var(--line)] px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm tracking-[0.14em] uppercase text-[color:var(--ink)]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
