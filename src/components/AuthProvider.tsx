"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  firebaseAddEnquiry,
  firebaseAuthEnabled,
  firebaseEnrichSession,
  firebaseGetEnquiries,
  firebaseGetIdToken,
  firebaseGetSavedSlugs,
  firebaseLogin,
  firebaseLogout,
  firebaseRegister,
  firebaseToggleSave,
  firebaseWatchEnquiries,
  watchFirebaseSession,
} from "@/lib/firebase-auth";
import { isAdminEmail } from "@/lib/admin";
import { filterAvailablePropertySlugs } from "@/data/properties";
import {
  addEnquiry,
  applyEnquiryStatusUpdates,
  ensureDemoAdminAccount,
  filterOwnEnquiries,
  normalizePortalEnquiries,
  getEnquiries,
  getSavedSlugs,
  getSession,
  isPropertySaved,
  loginUser,
  logoutUser,
  markNewSignupWelcome,
  registerUser,
  toggleSavedProperty,
  type PortalEnquiry,
  type PortalSession,
} from "@/lib/portal";

async function fetchStaffSession(): Promise<PortalSession | null> {
  try {
    const res = await fetch("/api/admin/session", {
      credentials: "include",
      cache: "no-store",
    });
    const data = (await res.json()) as {
      ok?: boolean;
      userId?: string;
      email?: string;
      name?: string;
      phone?: string;
    };
    if (!res.ok || !data.ok || !data.email || !data.userId) return null;
    return {
      userId: data.userId,
      email: data.email,
      name: data.name || "MRA Admin",
      phone: data.phone || "",
    };
  } catch {
    return null;
  }
}

async function staffPasswordLogin(
  email: string,
  password: string,
): Promise<PortalSession | null> {
  try {
    const res = await fetch("/api/admin/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      userId?: string;
      email?: string;
      name?: string;
      phone?: string;
    };
    if (!res.ok || !data.ok || !data.email || !data.userId) return null;
    return {
      userId: data.userId,
      email: data.email,
      name: data.name || "MRA Admin",
      phone: data.phone || "",
    };
  } catch {
    return null;
  }
}

type EnquiryStatusUpdate = {
  sourceEnquiryId: string;
  status: "answered" | "closed";
  reply: string;
  repliedAt: number;
};

async function fetchEnquiryStatusUpdates(
  email: string,
  ownEnquiries: PortalEnquiry[],
): Promise<EnquiryStatusUpdate[]> {
  try {
    const ids = ownEnquiries
      .map((item) => item.sourceEnquiryId)
      .filter((id): id is string => Boolean(id));
    const params = new URLSearchParams();
    if (ids.length) params.set("ids", ids.join(","));
    const headers: Record<string, string> = {
      "x-user-email": email,
    };
    const token = await firebaseGetIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const qs = params.toString();
    const res = await fetch(
      `/api/portal/enquiry-updates${qs ? `?${qs}` : ""}`,
      { headers, cache: "no-store" },
    );
    const data = (await res.json()) as {
      ok?: boolean;
      updates?: EnquiryStatusUpdate[];
    };
    if (!res.ok || !data.ok || !Array.isArray(data.updates)) return [];
    return data.updates;
  } catch {
    return [];
  }
}

function mergeEnquiryUpdates(
  list: PortalEnquiry[],
  updates: EnquiryStatusUpdate[],
): PortalEnquiry[] {
  if (updates.length === 0) return list;
  const byId = new Map(updates.map((item) => [item.sourceEnquiryId, item]));
  return normalizePortalEnquiries(
    list.map((item) => {
      const sourceId = item.sourceEnquiryId;
      if (!sourceId) return item;
      const update = byId.get(sourceId);
      if (!update) return item;
      return {
        ...item,
        status: update.status,
        reply: update.reply,
        repliedAt: update.repliedAt,
      };
    }),
  );
}

type AuthContextValue = {
  session: PortalSession | null;
  ready: boolean;
  isAdmin: boolean;
  /** True when NEXT_PUBLIC_FIREBASE_* env vars are set */
  usingFirebase: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  savedSlugs: string[];
  enquiries: PortalEnquiry[];
  isSaved: (slug: string) => boolean;
  toggleSave: (slug: string) => boolean | Promise<boolean>;
  recordEnquiry: (
    type: PortalEnquiry["type"],
    summary: string,
    extra?: {
      sourceEnquiryId?: string;
      status?: PortalEnquiry["status"];
    },
  ) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const usingFirebase = firebaseAuthEnabled();
  // Firebase sessions always come from Auth + Firestore profile (phone is Firestore-only).
  const [session, setSession] = useState<PortalSession | null>(() => {
    if (typeof window === "undefined") return null;
    if (!usingFirebase) return getSession();
    return null;
  });
  const [ready, setReady] = useState(() => !usingFirebase);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [enquiries, setEnquiries] = useState<PortalEnquiry[]>([]);

  const loadUserData = useCallback(
    async (next: PortalSession | null) => {
      if (!next) {
        setSession(null);
        setSavedSlugs([]);
        setEnquiries([]);
        return;
      }

      if (usingFirebase) {
        try {
          const enriched = await firebaseEnrichSession(next);
          setSession(enriched);
          const [saved, rawEnquiries, live] = await Promise.all([
            firebaseGetSavedSlugs(enriched.userId),
            firebaseGetEnquiries(enriched.userId),
            fetch("/api/properties")
              .then((res) => res.json())
              .then((data: { properties?: { slug: string }[] }) =>
                Array.isArray(data.properties)
                  ? data.properties.map((item) => item.slug)
                  : [],
              )
              .catch(() => [] as string[]),
          ]);
          const enquiryList = filterOwnEnquiries(
            enriched.userId,
            enriched.email,
            rawEnquiries,
          );
          const updates = await fetchEnquiryStatusUpdates(
            enriched.email,
            enquiryList,
          );
          const liveSet = new Set(live);
          setSavedSlugs(
            live.length
              ? saved.filter((slug) => liveSet.has(slug))
              : filterAvailablePropertySlugs(saved),
          );
          setEnquiries(mergeEnquiryUpdates(enquiryList, updates));
        } catch {
          setSession(next);
          setSavedSlugs([]);
          setEnquiries([]);
        }
        return;
      }

      setSession(next);
      const saved = getSavedSlugs(next.userId).map((item) => item.slug);
      try {
        const res = await fetch("/api/properties");
        const data = (await res.json()) as { properties?: { slug: string }[] };
        const live = Array.isArray(data.properties)
          ? data.properties.map((item) => item.slug)
          : [];
        const liveSet = new Set(live);
        setSavedSlugs(
          live.length
            ? saved.filter((slug) => liveSet.has(slug))
            : filterAvailablePropertySlugs(saved),
        );
      } catch {
        setSavedSlugs(filterAvailablePropertySlugs(saved));
      }
      const own = filterOwnEnquiries(
        next.userId,
        next.email,
        getEnquiries(next.userId, next.email),
      );
      const updates = await fetchEnquiryStatusUpdates(next.email, own);
      setEnquiries(
        filterOwnEnquiries(
          next.userId,
          next.email,
          applyEnquiryStatusUpdates(next.userId, updates),
        ),
      );
    },
    [usingFirebase],
  );

  useEffect(() => {
    if (usingFirebase) {
      const unsub = watchFirebaseSession((next) => {
        void (async () => {
          if (next) {
            await loadUserData(next);
          } else {
            await loadUserData(await fetchStaffSession());
          }
          setReady(true);
        })();
      });
      return unsub;
    }

    void ensureDemoAdminAccount()
      .then(async () => {
        const staff = await fetchStaffSession();
        await loadUserData(staff || getSession());
      })
      .finally(() => setReady(true));
    return undefined;
  }, [loadUserData, usingFirebase]);

  useEffect(() => {
    if (!ready || !session?.userId || !session.email) return;
    if (isAdminEmail(session.email)) return;

    let cancelled = false;
    const userId = session.userId;
    const email = session.email;

    const applyList = async (list: PortalEnquiry[]) => {
      const own = filterOwnEnquiries(userId, email, list);
      const updates = await fetchEnquiryStatusUpdates(email, own);
      if (cancelled) return;
      setEnquiries(mergeEnquiryUpdates(own, updates));
    };

    const refresh = async () => {
      try {
        const list = usingFirebase
          ? await firebaseGetEnquiries(userId)
          : getEnquiries(userId, email);
        await applyList(list);
      } catch {
        // Keep the last good list so a staff update cannot blank or crash the page.
      }
    };

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 4000);

    const unsub = usingFirebase
      ? firebaseWatchEnquiries(userId, (list) => {
          void applyList(list);
        })
      : () => undefined;

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      unsub();
    };
  }, [ready, session?.email, session?.userId, usingFirebase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      ready,
      isAdmin: isAdminEmail(session?.email),
      usingFirebase,
      login: async (email, password) => {
        if (isAdminEmail(email) && usingFirebase) {
          try {
            await loadUserData(await firebaseLogin(email, password));
            return;
          } catch {
            // Fall through to the env staff password, then local accounts.
          }
        }
        if (isAdminEmail(email)) {
          const staff = await staffPasswordLogin(email, password);
          if (staff) {
            await loadUserData(staff);
            return;
          }
        }
        if (usingFirebase) {
          try {
            await loadUserData(await firebaseLogin(email, password));
            return;
          } catch (error) {
            if (!isAdminEmail(email)) {
              try {
                await loadUserData(await loginUser({ email, password }));
                return;
              } catch {
                // Keep the Firebase error for the customer.
              }
            }
            throw error;
          }
        }
        await loadUserData(await loginUser({ email, password }));
      },
      register: async (input) => {
        if (usingFirebase) {
          await loadUserData(await firebaseRegister(input));
          try {
            await registerUser(input);
          } catch {
            // Local copy is only a fallback if Firebase sign-in is unavailable.
          }
          markNewSignupWelcome();
          return;
        }
        await loadUserData(await registerUser(input));
        markNewSignupWelcome();
      },
      logout: () => {
        void fetch("/api/admin/session", {
          method: "DELETE",
          credentials: "include",
        });
        if (usingFirebase) {
          void firebaseLogout().then(() => loadUserData(null));
          return;
        }
        logoutUser();
        void loadUserData(null);
      },
      savedSlugs,
      enquiries,
      isSaved: (slug) =>
        session
          ? usingFirebase
            ? savedSlugs.includes(slug)
            : isPropertySaved(session.userId, slug)
          : false,
      toggleSave: (slug) => {
        if (!session) return false;
        if (usingFirebase) {
          return firebaseToggleSave(session.userId, slug)
            .then((saved) => {
              setSavedSlugs((prev) =>
                saved ? [...prev, slug] : prev.filter((s) => s !== slug),
              );
              return saved;
            });
        }
        const saved = toggleSavedProperty(session.userId, slug);
        setSavedSlugs(getSavedSlugs(session.userId).map((item) => item.slug));
        return saved;
      },
      recordEnquiry: (type, summary, extra) => {
        if (!session) return;
        const payload = {
          type,
          summary,
          ownerUserId: session.userId,
          ownerEmail: session.email,
          status: extra?.status ?? "open" as const,
          ...(extra?.sourceEnquiryId
            ? { sourceEnquiryId: extra.sourceEnquiryId }
            : {}),
        };
        if (usingFirebase) {
          const optimistic: PortalEnquiry = {
            ...payload,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
          };
          setEnquiries((prev) =>
            filterOwnEnquiries(session.userId, session.email, [
              optimistic,
              ...prev,
            ]),
          );
          void firebaseAddEnquiry(session.userId, payload)
            .then((list) => {
              if (list.length === 0) return;
              setEnquiries(
                filterOwnEnquiries(session.userId, session.email, list),
              );
            })
            .catch(() => {
              // Inbox already saved; keep the optimistic account row.
            });
          return;
        }
        addEnquiry(session.userId, payload, session.email);
        setEnquiries(getEnquiries(session.userId, session.email));
      },
    }),
    [enquiries, loadUserData, ready, savedSlugs, session, usingFirebase],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
