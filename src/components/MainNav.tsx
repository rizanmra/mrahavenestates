"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { mainNav, utilityLinks, type NavItem } from "@/data/navigation";
import { site } from "@/data/site";

function MegaMenu({ item }: { item: NavItem }) {
  if (!item.columns) return null;

  return (
    <div className="absolute top-full left-0 z-50 hidden w-[720px] border border-[color:var(--line)] bg-[color:var(--navy-light)] p-8 shadow-2xl group-hover:block group-focus-within:block">
      {item.highlight ? (
        <Link
          href={item.highlight.href}
          className="btn-gold mb-6 inline-block px-5 py-2 text-xs font-semibold tracking-wide uppercase"
        >
          {item.highlight.label}
        </Link>
      ) : null}
      <div className="grid grid-cols-3 gap-8">
        {item.columns.map((column) => (
          <div key={column.title}>
            <p className="mb-4 text-xs font-semibold tracking-widest text-[color:var(--gold)] uppercase">
              {column.title}
            </p>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/90 hover:text-[color:var(--gold)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MainNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setMobileSection(null);
  }, [pathname]);

  function isActive(item: NavItem): boolean {
    if (item.href === "/") return pathname === "/";
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return (
    <header
      ref={headerRef}
      className={`absolute inset-x-0 top-0 z-50 ${
        pathname === "/"
          ? "bg-black/20 backdrop-blur-[2px]"
          : "bg-[color:var(--navy)]/90 backdrop-blur-md"
      }`}
    >
      <div className="hidden border-b border-white/10 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-6 px-6 py-2 text-xs">
          {utilityLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white/70 hover:text-[color:var(--gold)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-wide text-white">
            MRA
          </span>
          <span className="text-sm font-semibold tracking-wide text-white">
            Haven Estates
          </span>
          <span className="mt-1 text-[10px] tracking-[0.28em] text-[color:var(--gold)] uppercase">
            Helping People Move
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          <Link
            href="/"
            className={`text-sm ${
              pathname === "/"
                ? "text-[color:var(--gold)]"
                : "text-white hover:text-[color:var(--gold)]"
            }`}
          >
            Home
          </Link>
          {mainNav.map((item) => (
            <div key={item.label} className="group relative">
              <Link
                href={item.href}
                className={`inline-flex items-center gap-1 text-sm ${
                  isActive(item)
                    ? "text-[color:var(--gold)]"
                    : "text-white hover:text-[color:var(--gold)]"
                }`}
              >
                {item.label}
                {item.columns ? (
                  <span className="text-[10px] opacity-70" aria-hidden>
                    ▾
                  </span>
                ) : null}
              </Link>
              <MegaMenu item={item} />
            </div>
          ))}
        </nav>

        <button
          type="button"
          className="rounded border border-white/30 px-3 py-2 text-sm text-white lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </div>

      {mobileOpen ? (
        <nav className="max-h-[80vh] overflow-y-auto border-t border-[color:var(--line)] bg-[color:var(--navy)] px-6 py-4 lg:hidden">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm text-white"
          >
            Home
          </Link>
          {mainNav.map((item) => (
            <div key={item.label} className="border-t border-[color:var(--line)] py-2">
              <button
                type="button"
                className="flex w-full items-center justify-between py-2 text-left text-sm text-white"
                onClick={() =>
                  setMobileSection((current) =>
                    current === item.label ? null : item.label,
                  )
                }
              >
                {item.label}
                <span className="text-[color:var(--gold)]">
                  {mobileSection === item.label ? "−" : "+"}
                </span>
              </button>
              {mobileSection === item.label ? (
                <div className="pb-3 pl-3">
                  {item.highlight ? (
                    <Link
                      href={item.highlight.href}
                      onClick={() => setMobileOpen(false)}
                      className="mb-3 block text-sm text-[color:var(--gold)]"
                    >
                      {item.highlight.label}
                    </Link>
                  ) : null}
                  {item.columns?.map((column) => (
                    <div key={column.title} className="mt-3">
                      <p className="text-xs text-[color:var(--gold)] uppercase">
                        {column.title}
                      </p>
                      {column.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className="mt-1 block text-sm text-white/80"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                  {!item.columns ? (
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="text-sm text-white/80"
                    >
                      View {item.label}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
          <div className="border-t border-[color:var(--line)] pt-3">
            {utilityLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm text-white/70"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={`tel:${site.phone}`}
              className="block py-2 text-sm text-[color:var(--gold)]"
            >
              {site.phone}
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
