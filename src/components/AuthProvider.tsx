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
  watchFirebaseSession,
} from "@/lib/firebase-auth";
import { isAdminEmail } from "@/lib/admin";
import { filterAvailablePropertySlugs } from "@/data/properties";
import {
  addEnquiry,
  applyEnquiryStatusUpdates,
  ensureDemoAdminAccount,
  filterOwnEnquiries,
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
  return list.map((item) => {
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
  });
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
        void loadUserData(next).finally(() => setReady(true));
      });
      return unsub;
    }

    void ensureDemoAdminAccount()
      .then(() => loadUserData(getSession()))
      .finally(() => setReady(true));
    return undefined;
  }, [loadUserData, usingFirebase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      ready,
      isAdmin: isAdminEmail(session?.email),
      usingFirebase,
      login: async (email, password) => {
        if (usingFirebase) {
          await loadUserData(await firebaseLogin(email, password));
          return;
        }
        await loadUserData(await loginUser({ email, password }));
      },
      register: async (input) => {
        if (usingFirebase) {
          await loadUserData(await firebaseRegister(input));
          markNewSignupWelcome();
          return;
        }
        await loadUserData(await registerUser(input));
        markNewSignupWelcome();
      },
      logout: () => {
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
          sourceEnquiryId: extra?.sourceEnquiryId,
          status: extra?.status ?? "open",
        };
        if (usingFirebase) {
          void firebaseAddEnquiry(session.userId, payload).then((list) =>
            setEnquiries(
              filterOwnEnquiries(session.userId, session.email, list),
            ),
          );
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
