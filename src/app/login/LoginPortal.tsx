"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { site } from "@/data/site";

type Mode = "login" | "register";

export function LoginPortal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/account";
  const { login, register, session, ready, usingFirebase } = useAuth();

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

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setBusy(true);
    try {
      await login(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
      router.push(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function onRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await register({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
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
    <div className="pt-28">
      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
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
            <p className="mt-4 text-xs leading-relaxed text-[color:var(--muted)]">
              {usingFirebase
                ? "Secure sign-in is powered by Google Firebase."
                : "Demo mode: accounts are stored in this browser until Firebase is connected on go-live."}
            </p>
            <p className="mt-8 text-sm text-[color:var(--muted)]">
              Need help? Call{" "}
              <a href={site.phoneHref} className="text-[color:var(--gold)]">
                {site.phone}
              </a>
            </p>
          </div>

          <div className="border border-[color:var(--line)] bg-[color:var(--navy-light)] p-6 md:p-8">
            <div className="mb-8 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className={`py-3 text-sm font-semibold tracking-wide uppercase ${
                  mode === "login"
                    ? "bg-[#c41e3a] text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className={`py-3 text-sm font-semibold tracking-wide uppercase ${
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
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-gold w-full px-8 py-3 text-sm font-medium uppercase disabled:opacity-70"
                >
                  {busy ? "Signing in…" : "Sign in"}
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
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
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
              <Link href="/terms" className="text-[color:var(--gold)]">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[color:var(--gold)]">
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
