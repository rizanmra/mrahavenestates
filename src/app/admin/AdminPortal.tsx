"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import type { Property } from "@/data/properties";
import { firebaseGetIdToken } from "@/lib/firebase-auth";
import type { PropertyEnquiryRecord } from "@/lib/property-enquiry";

type Tab = "enquiries" | "listings" | "password";

const ENQUIRIES_PER_PAGE = 10;

const emptyForm = {
  title: "",
  location: "",
  price: "",
  beds: "2",
  area: "",
  summary: "",
  image: "",
};

export function AdminPortal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, session, isAdmin, logout, usingFirebase } = useAuth();
  const initialTab =
    searchParams.get("tab") === "listings"
      ? "listings"
      : searchParams.get("tab") === "password"
        ? "password"
        : "enquiries";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [enquiries, setEnquiries] = useState<PropertyEnquiryRecord[]>([]);
  const [listings, setListings] = useState<Property[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyBusy, setReplyBusy] = useState<string | null>(null);
  const [removeBusy, setRemoveBusy] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingBaths, setEditingBaths] = useState(1);
  const [listingType, setListingType] = useState<"sale" | "rent">("rent");
  const [listingBusy, setListingBusy] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [enquiryPage, setEnquiryPage] = useState(1);
  const listingEditorRef = useRef<HTMLFormElement>(null);
  const scrollToEditorAfterTab = useRef(false);

  const unread = useMemo(
    () =>
      enquiries.filter((item) => !item.read || item.status !== "answered")
        .length,
    [enquiries],
  );

  const sortedEnquiries = useMemo(
    () => [...enquiries].sort((a, b) => b.createdAt - a.createdAt),
    [enquiries],
  );

  const enquiryPageCount = Math.max(
    1,
    Math.ceil(sortedEnquiries.length / ENQUIRIES_PER_PAGE),
  );

  const pagedEnquiries = useMemo(() => {
    const start = (enquiryPage - 1) * ENQUIRIES_PER_PAGE;
    return sortedEnquiries.slice(start, start + ENQUIRIES_PER_PAGE);
  }, [enquiryPage, sortedEnquiries]);

  const authHeaders = useCallback(async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    // Force-refresh so staff API calls never send a stale/empty token.
    const token = await firebaseGetIdToken(true);
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  const ensureStaffSession = useCallback(async () => {
    const idToken = await firebaseGetIdToken(true);
    if (!idToken) {
      throw new Error(
        "Staff Firebase session missing. Sign out, then sign in again at /login with mrahavenestates@gmail.com.",
      );
    }
    const res = await fetch("/api/admin/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Could not create staff session.");
    }
  }, []);

  const loadEnquiries = useCallback(async () => {
    const res = await fetch("/api/admin/property-enquiries", {
      headers: await authHeaders(),
      cache: "no-store",
      credentials: "include",
    });
    const data = (await res.json()) as {
      ok?: boolean;
      error?: string;
      enquiries?: PropertyEnquiryRecord[];
    };
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Could not load property enquiries.");
    }
    setEnquiries(data.enquiries || []);
  }, [authHeaders]);

  const loadListings = useCallback(async () => {
    const res = await fetch("/api/admin/properties", {
      headers: await authHeaders(),
      cache: "no-store",
      credentials: "include",
    });
    const data = (await res.json()) as {
      ok?: boolean;
      error?: string;
      properties?: Property[];
    };
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Could not load listings.");
    }
    setListings(data.properties || []);
  }, [authHeaders]);

  const refresh = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      await ensureStaffSession();
      await Promise.all([loadEnquiries(), loadListings()]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load staff data.",
      );
    } finally {
      setLoading(false);
    }
  }, [ensureStaffSession, loadEnquiries, loadListings]);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      const timer = window.setTimeout(() => {
        router.replace("/login?next=/admin#login-form");
      }, 500);
      return () => window.clearTimeout(timer);
    }
    if (!isAdmin) {
      router.replace("/account");
    }
    return undefined;
  }, [isAdmin, ready, router, session]);

  useEffect(() => {
    const requested = searchParams.get("tab");
    const next =
      requested === "listings" || requested === "password"
        ? requested
        : "enquiries";
    setTab(next);
  }, [searchParams]);

  useEffect(() => {
    if (!ready || !session || !isAdmin) return;
    void refresh();
  }, [isAdmin, ready, refresh, session]);

  useEffect(() => {
    setEnquiryPage(1);
  }, [enquiries.length]);

  useEffect(() => {
    if (enquiryPage > enquiryPageCount) {
      setEnquiryPage(enquiryPageCount);
    }
  }, [enquiryPage, enquiryPageCount]);

  useEffect(() => {
    if (tab !== "listings" || !scrollToEditorAfterTab.current) return;
    scrollToEditorAfterTab.current = false;
    window.setTimeout(() => {
      listingEditorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }, [tab, editingSlug]);

  function selectTab(next: Tab) {
    setTab(next);
    const href =
      next === "listings"
        ? "/admin?tab=listings"
        : next === "password"
          ? "/admin?tab=password"
          : "/admin?tab=enquiries";
    router.replace(href, { scroll: false });
  }

  async function markRead(id: string, read: boolean) {
    const res = await fetch("/api/admin/property-enquiries", {
      method: "PATCH",
      headers: await authHeaders(),
      credentials: "include",
      body: JSON.stringify({ id, read }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      enquiry?: PropertyEnquiryRecord;
    };
    if (!res.ok || !data.ok || !data.enquiry) return;
    setEnquiries((current) =>
      current.map((item) => (item.id === id ? data.enquiry! : item)),
    );
  }

  async function sendReply(id: string) {
    const reply = (replyDrafts[id] || "").trim();
    if (!reply) return;
    setReplyBusy(id);
    setError("");
    try {
      const res = await fetch("/api/admin/property-enquiries", {
        method: "PATCH",
        headers: await authHeaders(),
        credentials: "include",
        body: JSON.stringify({ id, reply }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        enquiry?: PropertyEnquiryRecord;
      };
      if (!res.ok || !data.ok || !data.enquiry) {
        setError(data.error || "Could not send reply.");
        return;
      }
      setEnquiries((current) =>
        current.map((item) => (item.id === id ? data.enquiry! : item)),
      );
      setReplyDrafts((current) => ({ ...current, [id]: "" }));
    } catch {
      setError("Could not send reply.");
    } finally {
      setReplyBusy(null);
    }
  }

  async function removeEnquiry(id: string, title: string) {
    if (
      !window.confirm(
        `Remove enquiry for “${title}” from the staff inbox?\n\nIt will stay on the client account as Closed.`,
      )
    ) {
      return;
    }
    setRemoveBusy(id);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/property-enquiries?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: await authHeaders(),
          credentials: "include",
        },
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not remove enquiry.");
        return;
      }
      setEnquiries((current) => current.filter((item) => item.id !== id));
    } catch {
      setError("Could not remove enquiry.");
    } finally {
      setRemoveBusy(null);
    }
  }

  function startEdit(property: Property) {
    setEditingSlug(property.slug);
    setEditingTitle(property.title);
    setEditingBaths(property.baths || 1);
    setListingType(property.type === "sale" ? "sale" : "rent");
    setForm({
      title: property.title,
      location: property.location,
      price: property.price,
      beds: String(property.beds),
      area: property.area,
      summary: property.summary,
      image: property.image,
    });
    scrollToEditorAfterTab.current = true;
    if (tab === "listings") {
      window.setTimeout(() => {
        listingEditorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        scrollToEditorAfterTab.current = false;
      }, 50);
    } else {
      selectTab("listings");
    }
  }

  function resetForm() {
    setEditingSlug(null);
    setEditingTitle("");
    setEditingBaths(1);
    setListingType("rent");
    setForm(emptyForm);
  }

  async function onSaveListing(event: FormEvent) {
    event.preventDefault();
    setListingBusy(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        location: form.location,
        price: form.price,
        beds: Number(form.beds) || 0,
        baths: editingSlug ? editingBaths : 1,
        area: form.area,
        type: listingType,
        status: listingType === "sale" ? ("For Sale" as const) : ("For Rent" as const),
        summary: form.summary,
        image: form.image,
      };
      const res = await fetch("/api/admin/properties", {
        method: editingSlug ? "PATCH" : "POST",
        headers: await authHeaders(),
        body: JSON.stringify(
          editingSlug ? { ...payload, slug: editingSlug } : payload,
        ),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not save property.");
        return;
      }
      resetForm();
      await loadListings();
    } catch {
      setError("Could not save property.");
    } finally {
      setListingBusy(false);
    }
  }

  async function onDeleteListing(slug: string) {
    if (!window.confirm(`Remove listing “${slug}”?`)) return;
    setListingBusy(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/properties?slug=${encodeURIComponent(slug)}`,
        {
          method: "DELETE",
          headers: await authHeaders(),
          credentials: "include",
        },
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not remove property.");
        return;
      }
      if (editingSlug === slug) resetForm();
      await loadListings();
    } catch {
      setError("Could not remove property.");
    } finally {
      setListingBusy(false);
    }
  }

  async function onChangePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordMessage("");
    setError("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }
    setPasswordBusy(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: await authHeaders(),
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setPasswordMessage(data.error || "Could not update password.");
        return;
      }
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordMessage(
        "Password updated in Firebase. Use this password the next time you sign in.",
      );
    } catch {
      setPasswordMessage("Could not update password.");
    } finally {
      setPasswordBusy(false);
    }
  }

  if (!ready || !session || !isAdmin) {
    return (
      <div className="page-offset px-6 py-16 text-center text-[color:var(--muted)]">
        Loading staff portal…
      </div>
    );
  }

  return (
    <div className="page-offset">
      <section className="border-b border-[color:var(--line)] bg-[color:var(--navy-light)] px-6 py-16 lg:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs tracking-[0.35em] text-[color:var(--gold)] uppercase">
              Staff portal
            </p>
            <h1 className="font-display mt-3 text-4xl text-white md:text-5xl">
              Listings &amp; enquiries
            </h1>
            <p className="mt-4 max-w-2xl text-[color:var(--muted)]">
              Add, update, or remove sale and rental listings and reply to
              property enquiries. This portal is for staff only — not for
              client lead forms.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="btn-outline-gold cursor-pointer px-6 py-3 text-sm uppercase"
          >
            Sign out
          </button>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => selectTab("enquiries")}
              className={`cursor-pointer px-5 py-3 text-sm uppercase tracking-wide ${
                tab === "enquiries"
                  ? "bg-[color:var(--gold)] text-[color:var(--navy)]"
                  : "border border-[color:var(--line)] text-white hover:border-[color:var(--gold)]"
              }`}
            >
              Enquiries ({unread})
            </button>
            <button
              type="button"
              onClick={() => selectTab("listings")}
              className={`cursor-pointer px-5 py-3 text-sm uppercase tracking-wide ${
                tab === "listings"
                  ? "bg-[color:var(--gold)] text-[color:var(--navy)]"
                  : "border border-[color:var(--line)] text-white hover:border-[color:var(--gold)]"
              }`}
            >
              Listings ({listings.length})
            </button>
            <button
              type="button"
              onClick={() => selectTab("password")}
              className={`cursor-pointer px-5 py-3 text-sm uppercase tracking-wide ${
                tab === "password"
                  ? "bg-[color:var(--gold)] text-[color:var(--navy)]"
                  : "border border-[color:var(--line)] text-white hover:border-[color:var(--gold)]"
              }`}
            >
              Password
            </button>
          </div>

          {loading ? (
            <p className="mt-12 text-[color:var(--muted)]">Loading…</p>
          ) : null}
          {error ? <p className="mt-8 text-sm text-error">{error}</p> : null}

          {tab === "password" ? (
            <form
              onSubmit={onChangePassword}
              className="mt-12 max-w-lg space-y-4 border border-[color:var(--line)] p-6"
            >
              <h2 className="font-display text-3xl text-white">
                Change staff password
              </h2>
              <p className="text-sm text-[color:var(--muted)]">
                This saves the new password in Firebase Auth for{" "}
                {session.email}. You can also change it in the Firebase
                Console — either place is the login password.
              </p>
              <label className="block">
                <span className="text-sm text-white">Current password</span>
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                  className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                />
              </label>
              <label className="block">
                <span className="text-sm text-white">New password</span>
                <input
                  required
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                  className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                />
              </label>
              <label className="block">
                <span className="text-sm text-white">Confirm new password</span>
                <input
                  required
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                />
              </label>
              {passwordMessage ? (
                <p
                  className={`text-sm ${
                    passwordMessage.startsWith("Password updated")
                      ? "text-[color:var(--gold)]"
                      : "text-error"
                  }`}
                >
                  {passwordMessage}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={passwordBusy}
                className="btn-gold px-6 py-3 text-sm uppercase disabled:opacity-70"
              >
                {passwordBusy ? "Saving…" : "Update password"}
              </button>
            </form>
          ) : tab === "enquiries" ? (
            <div className="mt-12">
              {!loading && sortedEnquiries.length === 0 ? (
                <p className="text-[color:var(--muted)]">
                  No enquiries yet.
                </p>
              ) : null}
              {sortedEnquiries.length > 0 ? (
                <p className="mb-6 text-sm text-[color:var(--muted)]">
                  Newest first · {sortedEnquiries.length} total · page{" "}
                  {enquiryPage} of {enquiryPageCount}
                </p>
              ) : null}
              <ul className="space-y-6">
                {pagedEnquiries.map((enquiry) => {
                  const listingSlug = enquiry.property.slug || "";
                  const isContactRow =
                    enquiry.property.type === "contact" ||
                    listingSlug.startsWith("contact-");
                  const kind = isContactRow
                    ? "Contact"
                    : enquiry.property.type === "sale"
                      ? "Sale"
                      : "Rent";
                  return (
                  <li
                    key={enquiry.id}
                    className="border border-[color:var(--line)] bg-[color:var(--navy-light)] p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs tracking-[0.3em] text-[color:var(--gold)] uppercase">
                          {enquiry.status === "answered"
                            ? "Answered"
                            : enquiry.read
                              ? "Read"
                              : "New"}{" "}
                          · {kind}
                        </p>
                        <h2 className="font-display mt-2 text-2xl text-white">
                          {enquiry.property.title}
                        </h2>
                        <p className="mt-1 text-sm text-[color:var(--muted)]">
                          {enquiry.property.location} · {enquiry.property.price}
                        </p>
                      </div>
                      <p className="text-xs text-[color:var(--muted)]">
                        {new Date(enquiry.createdAt).toLocaleString("en-GB")}
                      </p>
                    </div>

                    <dl className="mt-6 grid gap-4 text-sm md:grid-cols-3">
                      <div>
                        <dt className="text-[color:var(--muted)]">Client</dt>
                        <dd className="mt-1 text-white">{enquiry.name}</dd>
                      </div>
                      <div>
                        <dt className="text-[color:var(--muted)]">Email</dt>
                        <dd className="mt-1 text-[color:var(--gold)]">
                          {enquiry.email}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[color:var(--muted)]">Phone</dt>
                        <dd className="mt-1 text-white">{enquiry.phone}</dd>
                      </div>
                    </dl>

                    <p className="mt-6 whitespace-pre-wrap text-white">
                      {enquiry.message}
                    </p>

                    {enquiry.reply ? (
                      <div className="mt-6 border border-[color:var(--line)] p-4">
                        <p className="text-xs uppercase tracking-widest text-[color:var(--gold)]">
                          Staff reply
                          {enquiry.status === "answered" ? " · shown on client account" : ""}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-white">
                          {enquiry.reply}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-6 space-y-3">
                      <label className="block">
                        <span className="text-sm text-white">
                          {enquiry.reply ? "Send a further reply" : "Reply to client"}
                        </span>
                        <textarea
                          rows={4}
                          value={replyDrafts[enquiry.id] || ""}
                          onChange={(event) =>
                            setReplyDrafts((current) => ({
                              ...current,
                              [enquiry.id]: event.target.value,
                            }))
                          }
                          className="mt-2 w-full border border-[color:var(--line)] bg-transparent p-3 text-white outline-none focus:border-[color:var(--gold)]"
                          placeholder="Write a reply. It is saved on the client account even if email is unavailable."
                        />
                      </label>
                      <button
                        type="button"
                        disabled={replyBusy === enquiry.id}
                        onClick={() => sendReply(enquiry.id)}
                        className="btn-gold px-6 py-3 text-sm uppercase disabled:opacity-70"
                      >
                        {replyBusy === enquiry.id
                          ? "Sending…"
                          : enquiry.reply
                            ? "Update reply"
                            : "Send reply"}
                      </button>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-4">
                      {isContactRow ? null : (
                        <Link
                          href={`/properties/${listingSlug}`}
                          className="text-sm text-[color:var(--gold)] hover:text-white"
                        >
                          Open listing →
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => markRead(enquiry.id, !enquiry.read)}
                        className="cursor-pointer text-sm text-white/70 hover:text-[color:var(--gold)]"
                      >
                        {enquiry.read ? "Mark as unread" : "Mark as read"}
                      </button>
                      <button
                        type="button"
                        disabled={removeBusy === enquiry.id}
                        onClick={() =>
                          removeEnquiry(enquiry.id, enquiry.property.title)
                        }
                        className="cursor-pointer text-sm text-white/70 hover:text-error disabled:opacity-70"
                      >
                        {removeBusy === enquiry.id
                          ? "Removing…"
                          : "Remove from inbox"}
                      </button>
                    </div>
                  </li>
                  );
                })}
              </ul>

              {sortedEnquiries.length > ENQUIRIES_PER_PAGE ? (
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
                  <button
                    type="button"
                    disabled={enquiryPage <= 1}
                    onClick={() => setEnquiryPage((page) => Math.max(1, page - 1))}
                    className="btn-outline-gold px-5 py-2 text-sm uppercase disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <p className="text-sm text-[color:var(--muted)]">
                    Page {enquiryPage} of {enquiryPageCount}
                  </p>
                  <button
                    type="button"
                    disabled={enquiryPage >= enquiryPageCount}
                    onClick={() =>
                      setEnquiryPage((page) =>
                        Math.min(enquiryPageCount, page + 1),
                      )
                    }
                    className="btn-outline-gold px-5 py-2 text-sm uppercase disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-12 space-y-12">
              <form
                id="listing-editor"
                ref={listingEditorRef}
                onSubmit={onSaveListing}
                className="scroll-mt-36 space-y-4 border border-[color:var(--line)] p-6"
              >
                <h2 className="font-display text-3xl text-white">
                  {editingSlug ? "Edit listing" : "Add listing"}
                </h2>
                {editingSlug ? (
                  <p className="rounded-sm border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 px-4 py-3 text-sm text-[color:var(--gold)]">
                    You are editing{" "}
                    <span className="font-medium text-white">
                      {editingTitle || form.title || "this listing"}
                    </span>
                    . Choose sale or rent, update the fields, then save.
                  </p>
                ) : (
                  <p className="text-sm text-[color:var(--muted)]">
                    Choose whether this property is for sale or to rent. The
                    listing URL is generated automatically from the title.
                  </p>
                )}
                <fieldset>
                  <legend className="text-sm text-white">Listing type *</legend>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {(
                      [
                        ["sale", "For sale"],
                        ["rent", "For rent"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setListingType(value)}
                        className={`cursor-pointer px-4 py-3 text-sm font-semibold uppercase tracking-wide ${
                          listingType === value
                            ? "bg-[color:var(--gold)] text-[color:var(--navy)]"
                            : "border border-[color:var(--line)] text-white hover:border-[color:var(--gold)]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="grid gap-4 md:grid-cols-2">
                  {(
                    [
                      ["title", "Title"],
                      ["location", "Location"],
                      [
                        "price",
                        listingType === "sale"
                          ? "Price (e.g. £285,000)"
                          : "Price (e.g. £950 pcm)",
                      ],
                      ["area", "Area"],
                      ["beds", "Bedrooms"],
                      ["image", "Image URL"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="block">
                      <span className="text-sm text-white">{label}</span>
                      <input
                        required
                        value={form[key]}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                        className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                      />
                    </label>
                  ))}
                </div>
                <label className="block">
                  <span className="text-sm text-white">Summary</span>
                  <textarea
                    required
                    rows={4}
                    value={form.summary}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        summary: event.target.value,
                      }))
                    }
                    className="mt-2 w-full border border-[color:var(--line)] bg-transparent p-3 text-white outline-none focus:border-[color:var(--gold)]"
                  />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={listingBusy}
                    className="btn-gold px-6 py-3 text-sm uppercase disabled:opacity-70"
                  >
                    {listingBusy
                      ? "Saving…"
                      : editingSlug
                        ? "Update listing"
                        : "Add listing"}
                  </button>
                  {editingSlug ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="btn-outline-gold px-6 py-3 text-sm uppercase"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </form>

              <ul className="space-y-4">
                {listings.map((property) => (
                  <li
                    key={property.slug}
                    className="flex flex-wrap items-start justify-between gap-4 border border-[color:var(--line)] p-5"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-widest text-[color:var(--gold)]">
                        {property.type === "sale" ? "For sale" : "For rent"} ·{" "}
                        {property.beds}{" "}
                        {property.beds === 1 ? "bedroom" : "bedrooms"}
                      </p>
                      <h3 className="font-display mt-1 text-2xl text-white">
                        {property.title}
                      </h3>
                      <p className="mt-1 text-sm text-[color:var(--muted)]">
                        {property.location} · {property.price}
                      </p>
                      <p className="mt-2 text-xs text-[color:var(--muted)]">
                        Added{" "}
                        {new Date(property.createdAt).toLocaleString("en-GB")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(property)}
                        className="cursor-pointer text-sm text-[color:var(--gold)] hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteListing(property.slug)}
                        className="cursor-pointer text-sm text-white/70 hover:text-error"
                      >
                        Remove
                      </button>
                      <Link
                        href={`/properties/${property.slug}`}
                        className="text-sm text-white/70 hover:text-[color:var(--gold)]"
                      >
                        View
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
