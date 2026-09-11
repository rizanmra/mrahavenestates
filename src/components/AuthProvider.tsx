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
  firebaseGetEnquiries,
  firebaseGetSavedSlugs,
  firebaseLogin,
  firebaseLogout,
  firebaseRegister,
  firebaseToggleSave,
  watchFirebaseSession,
} from "@/lib/firebase-auth";
import {
  addEnquiry,
  getEnquiries,
  getSavedSlugs,
  getSession,
  isPropertySaved,
  loginUser,
  logoutUser,
  registerUser,
  toggleSavedProperty,
  type PortalEnquiry,
  type PortalSession,
} from "@/lib/portal";

type AuthContextValue = {
  session: PortalSession | null;
  ready: boolean;
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
  recordEnquiry: (type: PortalEnquiry["type"], summary: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const usingFirebase = firebaseAuthEnabled();
  const [session, setSession] = useState<PortalSession | null>(null);
  const [ready, setReady] = useState(false);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [enquiries, setEnquiries] = useState<PortalEnquiry[]>([]);

  const loadUserData = useCallback(
    async (next: PortalSession | null) => {
      setSession(next);
      if (!next) {
        setSavedSlugs([]);
        setEnquiries([]);
        return;
      }

      if (usingFirebase) {
        const [saved, enquiryList] = await Promise.all([
          firebaseGetSavedSlugs(next.userId),
          firebaseGetEnquiries(next.userId),
        ]);
        setSavedSlugs(saved);
        setEnquiries(enquiryList);
        return;
      }

      setSavedSlugs(getSavedSlugs(next.userId).map((item) => item.slug));
      setEnquiries(getEnquiries(next.userId));
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

    void loadUserData(getSession()).finally(() => setReady(true));
    return undefined;
  }, [loadUserData, usingFirebase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      ready,
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
          return;
        }
        await loadUserData(await registerUser(input));
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
          return firebaseToggleSave(session.userId, slug).then((saved) => {
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
      recordEnquiry: (type, summary) => {
        if (!session) return;
        if (usingFirebase) {
          void firebaseAddEnquiry(session.userId, { type, summary }).then(
            setEnquiries,
          );
          return;
        }
        addEnquiry(session.userId, { type, summary });
        setEnquiries(getEnquiries(session.userId));
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
