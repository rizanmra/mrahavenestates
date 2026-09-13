import { getAdminAuth } from "@/lib/firebase-admin";
import { getAdminEmail, getAdminPassword } from "@/lib/admin-server";
import { staffPasswordMatches } from "@/lib/admin-session";

function firebaseApiKey() {
  return process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || "";
}

async function signInWithPassword(email: string, password: string) {
  const apiKey = firebaseApiKey();
  if (!apiKey) return null;
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
      signal: AbortSignal.timeout(15000),
    },
  );
  const data = (await res.json()) as {
    idToken?: string;
    localId?: string;
    error?: { message?: string };
  };
  if (!res.ok || !data.idToken) return null;
  return { idToken: data.idToken, localId: data.localId || "" };
}

async function updatePasswordWithToken(idToken: string, password: string) {
  const apiKey = firebaseApiKey();
  if (!apiKey) return false;
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        password,
        returnSecureToken: true,
      }),
      signal: AbortSignal.timeout(15000),
    },
  );
  return res.ok;
}

async function createStaffUser(email: string, password: string) {
  const apiKey = firebaseApiKey();
  if (!apiKey) return false;
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
      signal: AbortSignal.timeout(15000),
    },
  );
  const data = (await res.json()) as { error?: { message?: string } };
  if (res.ok) return true;
  return data.error?.message === "EMAIL_EXISTS";
}

async function updatePasswordWithAdminSdk(email: string, password: string) {
  const auth = getAdminAuth();
  if (!auth) return false;
  try {
    const user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password });
    return true;
  } catch {
    try {
      await auth.createUser({
        email,
        password,
        displayName: process.env.ADMIN_NAME?.trim() || "MRA Admin",
      });
      return true;
    } catch {
      return false;
    }
  }
}

export async function changeStaffPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = getAdminEmail();
  const current = input.currentPassword;
  const next = input.newPassword;

  if (next.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters." };
  }
  if (current === next) {
    return { ok: false, error: "Choose a different new password." };
  }

  const envPassword = getAdminPassword();
  const currentIsEnv = staffPasswordMatches(current);
  const signedIn = await signInWithPassword(email, current);
  if (!signedIn && !currentIsEnv) {
    return { ok: false, error: "Current password is incorrect." };
  }

  if (signedIn && (await updatePasswordWithToken(signedIn.idToken, next))) {
    return { ok: true };
  }

  if (currentIsEnv && envPassword) {
    const envSignIn = await signInWithPassword(email, envPassword);
    if (envSignIn && (await updatePasswordWithToken(envSignIn.idToken, next))) {
      return { ok: true };
    }
  }

  if (await updatePasswordWithAdminSdk(email, next)) {
    return { ok: true };
  }

  if (await createStaffUser(email, next)) {
    const created = await signInWithPassword(email, next);
    if (created) return { ok: true };
    const existing = await signInWithPassword(email, current);
    if (existing && (await updatePasswordWithToken(existing.idToken, next))) {
      return { ok: true };
    }
  }

  return {
    ok: false,
    error:
      "Could not save the new password in Firebase. Check the current password and try again.",
  };
}
