"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { site } from "@/data/site";
import { isAdminEmail } from "@/lib/admin";
import {
  formatPhoneForStorage,
  validateEmail,
  validateName,
  validatePhone,
} from "@/lib/form-validation";

type Mode = "login" | "register";

export function LoginPortal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, session, ready, isAdmin } = useAuth();
  const nextPath = searchParams.get("next") || (isAdmin ? "/admin" : "/account");

  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const heading = useMemo(
    () => (mode === "login" ? "Client login" : "Create your account"),
    [mode],
  );

  useEffect(() => {
    if (ready && session) {
      router.replace(nextPath);
    }
  }, [nextPath, ready, router, session]);

  useEffect(() => {
    function shouldScroll() {
      try {
        if (sessionStorage.getItem("mra-scroll-login-form") === "1") return true;
      } catch {
        // ignore
      }
      return window.location.hash === "#login-form";
    }

    function headerOffsetPx() {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(
        "--site-header-offset",
      );
      if (raw.includes("rem")) {
        return (
          Number.parseFloat(raw) *
          Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
        );
      }
      return Number.parseFloat(raw) || 184;
    }

    function scrollToForm() {
      const el = document.getElementById("login-form");
      if (!el) return false;
      const top =
        el.getBoundingClientRect().top + window.scrollY - headerOffsetPx() - 16;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      return true;
    }

    if (!shouldScroll()) return;

    const timers = [50, 150, 350, 700].map((ms) =>
      window.setTimeout(() => {
        if (scrollToForm()) {
          try {
            sessionStorage.removeItem("mra-scroll-login-form");
          } catch {
            // ignore
          }
        }
      }, ms),
    );

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);

  function selectMode(next: Mode) {
    setMode(next);
    setError("");
    window.requestAnimationFrame(() => {
      const el = document.getElementById("login-form");
      if (!el) return;
      const raw = getComputedStyle(document.documentElement).getPropertyValue(
        "--site-header-offset",
      );
      const offset = raw.includes("rem")
        ? Number.parseFloat(raw) *
          Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
        : Number.parseFloat(raw) || 184;
      const top =
        el.getBoundingClientRect().top + window.scrollY - offset - 16;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
  }

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setBusy(true);
    try {
      await login(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
      const email = String(form.get("email") ?? "").trim().toLowerCase();
      router.push(isAdminEmail(email) ? "/admin" : nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    } finally {
      setBusy(false);
    }
  }

  async function onRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const phone = String(form.get("phone") ?? "");
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const phoneError = validatePhone(phone, true);
    if (nameError || emailError || phoneError) {
      setError(nameError || emailError || phoneError || "");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await register({
        name: name.trim().replace(/\s+/g, " "),
        email: email.trim().toLowerCase(),
        phone: formatPhoneForStorage(phone),
        password,
      });
      router.push(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-offset">
      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-12 lg:gap-14">
          <div className="max-w-2xl">
            <p className="text-xs tracking-[0.35em] text-[color:var(--gold)] uppercase">
              Client portal
            </p>
            <h1 className="font-display mt-3 text-5xl text-white md:text-6xl">
              {heading}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[color:var(--muted)]">
              Save properties, track enquiries, and manage your moving journey
              with {site.name}.
            </p>
            <p className="mt-8 text-sm text-[color:var(--muted)]">
              Need help? Call{" "}
              <a href={site.phoneHref} className="text-[color:var(--gold)]">
                {site.phone}
              </a>
            </p>
          </div>

          <div
            id="login-form"
            className="scroll-mt-[calc(var(--site-header-offset)+1rem)] border border-[color:var(--line)] bg-[color:var(--navy-light)] p-6 md:p-8"
          >
            <div className="mb-8 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => selectMode("login")}
                className={`cursor-pointer py-3 text-sm font-semibold tracking-wide uppercase transition-colors ${
                  mode === "login"
                    ? "bg-[color:var(--gold)] text-[color:var(--navy)]"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => selectMode("register")}
                className={`cursor-pointer py-3 text-sm font-semibold tracking-wide uppercase transition-colors ${
                  mode === "register"
                    ? "bg-[color:var(--gold)] text-[color:var(--navy)]"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Register
              </button>
            </div>

            {mode === "login" ? (
              <form onSubmit={onLogin} className="space-y-5">
                <label className="block">
                  <span className="text-sm text-white">Email</span>
                  <input
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-white">Password</span>
                  <input
                    required
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                  />
                </label>
                {error ? <p className="text-sm text-error">{error}</p> : null}
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-gold w-full px-8 py-3 text-sm font-medium uppercase disabled:opacity-70"
                >
                  {busy ? "Logging in…" : "Login"}
                </button>
              </form>
            ) : (
              <form onSubmit={onRegister} className="space-y-5">
                <label className="block">
                  <span className="text-sm text-white">Full name</span>
                  <input
                    required
                    name="name"
                    autoComplete="name"
                    className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-white">Email</span>
                  <input
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-white">Phone</span>
                  <input
                    required
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    placeholder="07xxx xxx xxx"
                    className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-white">Password</span>
                  <input
                    required
                    minLength={8}
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-white">Confirm password</span>
                  <input
                    required
                    minLength={8}
                    type="password"
                    name="confirm"
                    autoComplete="new-password"
                    className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                  />
                </label>
                {error ? <p className="text-sm text-error">{error}</p> : null}
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-gold w-full px-8 py-3 text-sm font-medium uppercase disabled:opacity-70"
                >
                  {busy ? "Creating account…" : "Create account"}
                </button>
              </form>
            )}

            <p className="mt-6 text-xs leading-relaxed text-[color:var(--muted)]">
              By continuing you agree to our{" "}
              <Link
                href="/terms"
                className="cursor-pointer text-[color:var(--gold)] transition-colors hover:text-white hover:underline"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="cursor-pointer text-[color:var(--gold)] transition-colors hover:text-white hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
