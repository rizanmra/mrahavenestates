"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BrandLogo } from "@/components/BrandLogo";
import { mainNav, utilityLinks, type NavItem } from "@/data/navigation";
import { site } from "@/data/site";

function navItemActive(pathname: string, search: string, item: NavItem): boolean {
  const [path, query = ""] = item.href.split("?");
  if (path === "/admin") {
    if (!pathname.startsWith("/admin")) return false;
    if (!query) return !search.includes("tab=") || search.includes("tab=enquiries");
    return (
      search.includes(query) ||
      (!search.includes("tab=") && query.includes("enquiries"))
    );
  }
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSection, setMenuSection] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const { session, logout, isAdmin } = useAuth();

  const homeHref = "/";

  const visibleUtilityLinks = utilityLinks.filter((link) => {
    if (link.href === "/account" || link.href === "/saved-properties") {
      return Boolean(session) && !isAdmin;
    }
    if (link.href === "/admin") {
      return Boolean(session) && isAdmin;
    }
    if (link.href.startsWith("/login")) return !session;
    return true;
  });

  function signOut() {
    logout();
    setMenuOpen(false);
    router.push(isAdmin ? "/login" : "/");
  }

  useEffect(() => {
    setSearch(typeof window !== "undefined" ? window.location.search : "");
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
    setMenuSection(null);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function closeIfScrolledAway() {
      const panel = menuPanelRef.current;
      if (!panel) return;
      const { bottom } = panel.getBoundingClientRect();
      // Menu is fully above the viewport — user scrolled past it
      if (bottom <= 0) {
        setMenuOpen(false);
        setMenuSection(null);
      }
    }

    window.addEventListener("scroll", closeIfScrolledAway, { passive: true });
    closeIfScrolledAway();
    return () => window.removeEventListener("scroll", closeIfScrolledAway);
  }, [menuOpen]);

  return (
    <header
      className={`absolute inset-x-0 top-0 z-50 ${
        pathname === "/"
          ? "bg-black/20 backdrop-blur-[2px]"
          : "bg-[color:var(--navy)]/90 backdrop-blur-md"
      }`}
    >
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-x-6 gap-y-1 px-6 py-2.5 text-base">
          {visibleUtilityLinks.map((link) => {
            const isLogin = link.href.startsWith("/login");
            return (
              <Link
                key={link.href}
                href={link.href}
                scroll={!isLogin}
                onClick={() => {
                  if (!isLogin) return;
                  try {
                    sessionStorage.setItem("mra-scroll-login-form", "1");
                  } catch {
                    // ignore
                  }
                  if (pathname.startsWith("/login")) {
                    window.setTimeout(() => {
                      const el = document.getElementById("login-form");
                      if (!el) return;
                      const raw = getComputedStyle(
                        document.documentElement,
                      ).getPropertyValue("--site-header-offset");
                      const offset = raw.includes("rem")
                        ? Number.parseFloat(raw) *
                          Number.parseFloat(
                            getComputedStyle(document.documentElement).fontSize,
                          )
                        : Number.parseFloat(raw) || 184;
                      const top =
                        el.getBoundingClientRect().top +
                        window.scrollY -
                        offset -
                        16;
                      window.scrollTo({
                        top: Math.max(0, top),
                        behavior: "smooth",
                      });
                    }, 50);
                  }
                }}
                className="cursor-pointer whitespace-nowrap text-white/70 transition-colors hover:text-[color:var(--gold)]"
              >
                {link.label}
              </Link>
            );
          })}
          {session ? (
            <button
              type="button"
              onClick={signOut}
              className="cursor-pointer whitespace-nowrap text-white/70 transition-colors hover:text-[color:var(--gold)]"
            >
              Sign out
            </button>
          ) : null}
          <a
            href={site.phoneHref}
            className="cursor-pointer whitespace-nowrap text-[color:var(--gold)] transition-colors hover:text-white"
          >
            {site.phone}
          </a>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-10">
        <div className="shrink-0">
          <BrandLogo href={homeHref} priority />
        </div>

        <button
          type="button"
          className={`shrink-0 cursor-pointer rounded border px-5 py-3 text-base font-medium tracking-wide transition-colors ${
            menuOpen
              ? "border-[color:var(--gold)] text-[color:var(--gold)]"
              : "border-white/40 text-white hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
          }`}
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {menuOpen ? (
        <div
          ref={menuPanelRef}
          className="border-t border-[color:var(--line)] bg-[color:var(--navy)]"
        >
          <nav className="mx-auto max-w-7xl px-6 py-4 lg:px-10">
            <Link
              href={homeHref}
              onClick={() => setMenuOpen(false)}
              className={`block cursor-pointer py-2.5 text-base transition-colors hover:text-[color:var(--gold)] ${
                pathname === "/" ? "text-[color:var(--gold)]" : "text-white"
              }`}
            >
              Home
            </Link>
            {mainNav.map((item) => {
              const sectionOpen = menuSection === item.label;
              return (
                <div
                  key={item.label}
                  className="border-t border-[color:var(--line)] py-1"
                >
                  <button
                    type="button"
                    className={`flex w-full cursor-pointer items-center justify-between py-2.5 text-left text-base transition-colors hover:text-[color:var(--gold)] ${
                      sectionOpen || navItemActive(pathname, search, item)
                        ? "text-[color:var(--gold)]"
                        : "text-white"
                    }`}
                    onClick={() =>
                      setMenuSection((current) =>
                        current === item.label ? null : item.label,
                      )
                    }
                  >
                    {item.label}
                    <span className="text-[color:var(--gold)]" aria-hidden>
                      {sectionOpen ? "−" : "+"}
                    </span>
                  </button>
                  {sectionOpen ? (
                    <div className="pb-3 pl-3">
                      {item.highlight ? (
                        <Link
                          href={item.highlight.href}
                          onClick={() => setMenuOpen(false)}
                          className="mb-3 block cursor-pointer text-sm text-[color:var(--gold)] transition-colors hover:underline"
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
                              onClick={() => setMenuOpen(false)}
                              className="mt-1 block cursor-pointer text-sm text-white/80 transition-colors hover:text-[color:var(--gold)]"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      ))}
                      {!item.columns ? (
                        <Link
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className="block cursor-pointer text-sm text-white/80 transition-colors hover:text-[color:var(--gold)]"
                        >
                          View {item.label}
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
            <div className="mt-4 space-y-1 border-t border-[color:var(--line)] pt-4">
              {visibleUtilityLinks.map((link) => {
                const isLogin = link.href.startsWith("/login");
                return (
                  <Link
                    key={`menu-${link.href}`}
                    href={link.href}
                    scroll={!isLogin}
                    onClick={() => {
                      if (isLogin) {
                        try {
                          sessionStorage.setItem("mra-scroll-login-form", "1");
                        } catch {
                          // ignore
                        }
                      }
                      setMenuOpen(false);
                    }}
                    className="block cursor-pointer py-2.5 text-base text-white transition-colors hover:text-[color:var(--gold)]"
                  >
                    {link.label}
                  </Link>
                );
              })}
              {session ? (
                <button
                  type="button"
                  onClick={signOut}
                  className="block w-full cursor-pointer py-2.5 text-left text-base text-white transition-colors hover:text-[color:var(--gold)]"
                >
                  Sign out
                </button>
              ) : null}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
