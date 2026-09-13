"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  firebaseAddEnquiry,
  firebaseAuthEnabled,
  firebaseCurrentUserId,
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
import { filterAvailablePropertySlugs } from "@/data/properties";
import {
  addEnquiry,
  applyEnquiryStatusUpdates,
  clearLocalAccounts,
  filterOwnEnquiries,
  normalizePortalEnquiries,
  getEnquiries,
  getSavedSlugs,
  isPropertySaved,
  logoutUser,
  markNewSignupWelcome,
  setSession as persistPortalSession,
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
      isAdmin: true,
    };
  } catch {
    return null;
  }
}

async function attachStaffCookieFromToken() {
  const idToken = await firebaseGetIdToken();
  if (!idToken) return;
  try {
    await fetch("/api/admin/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  } catch {
    // Cookie is optional when Firebase Auth is already signed in.
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
  login: (email: string, password: string) => Promise<PortalSession>;
  register: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<PortalSession>;
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
  const [session, setSession] = useState<PortalSession | null>(() => {
    if (typeof window === "undefined") return null;
    clearLocalAccounts();
    return null;
  });
  const [ready, setReady] = useState(() => !usingFirebase);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [enquiries, setEnquiries] = useState<PortalEnquiry[]>([]);
  const authEpoch = useRef(0);
  const hadFirebaseUser = useRef(false);

  const loadUserData = useCallback(
    async (next: PortalSession | null, epoch?: number) => {
      if (epoch !== undefined && epoch !== authEpoch.current) return;
      if (!next) {
        persistPortalSession(null);
        setSession(null);
        setSavedSlugs([]);
        setEnquiries([]);
        return;
      }

      // Keep the user signed in immediately; profile extras can follow.
      setSession(next);
      persistPortalSession(next);

      const canUseFirestore =
        usingFirebase && firebaseCurrentUserId() === next.userId;
      if (canUseFirestore) {
        try {
          const enriched = await firebaseEnrichSession(next);
          if (epoch !== undefined && epoch !== authEpoch.current) return;
          setSession(enriched);
          persistPortalSession(enriched);
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
          if (epoch !== undefined && epoch !== authEpoch.current) return;
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
          try {
            if (next) {
              hadFirebaseUser.current = true;
              await loadUserData(next, authEpoch.current);
              return;
            }
            const epoch = authEpoch.current;
            const staff = await fetchStaffSession();
            if (epoch !== authEpoch.current) return;
            if (firebaseCurrentUserId()) return;
            if (staff) {
              hadFirebaseUser.current = false;
              await loadUserData(staff, epoch);
              return;
            }
            if (hadFirebaseUser.current) {
              hadFirebaseUser.current = false;
              await loadUserData(null, epoch);
            }
          } finally {
            setReady(true);
          }
        })();
      });
      return unsub;
    }

    setReady(true);
    return undefined;
  }, [loadUserData, usingFirebase]);

  useEffect(() => {
    if (!ready || !session?.userId || !session.email) return;
    if (session.isAdmin) return;

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
        const list =
          usingFirebase && firebaseCurrentUserId() === userId
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

    const unsub =
      usingFirebase && firebaseCurrentUserId() === userId
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
      isAdmin: Boolean(session?.isAdmin),
      usingFirebase,
      login: async (email, password) => {
        if (!usingFirebase) {
          throw new Error("Accounts are stored in Firebase. Add the Firebase keys and try again.");
        }
        const epoch = ++authEpoch.current;
        const next = await firebaseLogin(email.trim().toLowerCase(), password);
        if (next.isAdmin) await attachStaffCookieFromToken();
        hadFirebaseUser.current = firebaseCurrentUserId() === next.userId;
        await loadUserData(next, epoch);
        setReady(true);
        return next;
      },
      register: async (input) => {
        if (!usingFirebase) {
          throw new Error("Accounts are stored in Firebase. Add the Firebase keys and try again.");
        }
        const epoch = ++authEpoch.current;
        const next = await firebaseRegister(input);
        if (next.isAdmin) await attachStaffCookieFromToken();
        hadFirebaseUser.current = firebaseCurrentUserId() === next.userId;
        await loadUserData(next, epoch);
        markNewSignupWelcome();
        setReady(true);
        return next;
      },
      logout: () => {
        authEpoch.current += 1;
        hadFirebaseUser.current = false;
        void fetch("/api/admin/session", {
          method: "DELETE",
          credentials: "include",
        });
        if (usingFirebase) {
          void firebaseLogout().then(() => loadUserData(null, authEpoch.current));
          return;
        }
        logoutUser();
        void loadUserData(null, authEpoch.current);
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
