# Go-live checklist (client sitting with you)

Use this when creating the client's **Vercel** and **Firebase** accounts in the office.

## Before the meeting

- [ ] Site builds locally: `npm run build`
- [ ] Logo, calculators, and portal work on `http://localhost:3000`
- [ ] GitHub repo is up to date (`git push`)
- [ ] Client brings an email they control (Gmail or business)

## 1. Client creates accounts (they own them)

1. Google account (or use existing)
2. [Firebase Console](https://console.firebase.google.com) → Create project → Enable **Email/Password** auth
3. Firestore → Create database (production mode) → add rules (below)
4. Project settings → Add web app → copy config keys
5. [Vercel](https://vercel.com) → Sign up with same email → Import GitHub repo
6. Invite you as collaborator on Vercel + GitHub if needed

### Firestore rules (paste in Firebase → Firestore → Rules → Publish)

Use the exact rules below. After any change, click **Publish**.

If the admin inbox stays empty after a successful enquiry, the usual cause is
old rules that blocked create/read — republish these rules, then ask the client
to refresh `/admin`.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && (
          request.auth.token.email == 'mrahavenestates@gmail.com'
          || (
            exists(/databases/$(database)/documents/config/admin)
            && get(/databases/$(database)/documents/config/admin).data.email
              == request.auth.token.email
          )
        );
    }

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /config/admin {
      allow read: if request.auth != null;
      allow write: if false;
    }

    match /properties/{slug} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    match /propertyEnquiries/{enquiryId} {
      // Public can submit; staff sees full inbox; clients see their own rows.
      allow create: if true;
      allow read: if isAdmin()
        || (request.auth != null
            && request.auth.token.email == resource.data.email);
      allow update, delete: if isAdmin();
    }
  }
}
```

### Firebase Auth

- Authentication → Sign-in method → **Email/Password** → Enable
- Staff login email: `mrahavenestates@gmail.com` (reset password from Firebase if needed)

## 2. Add env vars on Vercel

Project → Settings → Environment Variables → add all from `.env.example`
(use the **same** values as local `.env.local` — project `mra-haven-estates-2e26e`):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Redeploy after saving.

Do **not** put Firebase API keys in git. Keep them in `.env.local` (local) and
Vercel Environment Variables (live) only.

If login works on localhost but not on the live site, Vercel is almost always
pointing at a different Firebase project (or missing these vars). Local auth
does **not** read passwords from Firestore — it uses **Firebase Authentication**.

### Firebase Auth → Authorized domains

In Firebase Console (project `mra-haven-estates-2e26e`) → Authentication →
Settings → Authorized domains, include:

- `localhost`
- `mrahavenestates.vercel.app`
- `mrahavenestates.com`
- `www.mrahavenestates.com`

## 3. Domains (Vercel project: mrahavenestates)

Both domains are already attached on Vercel. Do not remove them.

### Live now — GoDaddy `.com`

- `mrahavenestates.com` → Production (redirects to `www`)
- `www.mrahavenestates.com` → Production

In GoDaddy → **mrahavenestates.com** → DNS, set:

| Type | Name | Value |
|------|------|--------|
| **A** | `@` | `216.198.79.1` |
| **CNAME** | `www` | `9d9bd12c71a4aab4.vercel-dns-017.com` |

Remove any old A / CNAME / parking records that conflict. Wait 5–30 minutes. Vercel will flip from Invalid Configuration to Valid.

### Later — broker `.co.uk` (keep attached, do not delete)

- `mrahavenestates.co.uk` is already on the project
- `www.mrahavenestates.co.uk` was added with it

When the broker transfer finishes, point that registrar’s DNS at the same Vercel records (A `@` → `216.198.79.1`, plus the CNAME shown on Vercel for `www`). Until then, leave the `.co.uk` entries as Invalid Configuration.

Site is already live at https://mrahavenestates.vercel.app even before custom DNS completes.

## 4. Smoke test after deploy

- [ ] Homepage + logo
- [ ] `/property-value-calculator`
- [ ] `/stamp-duty`
- [ ] `/login` register + login (Firebase)
- [ ] Save a property while logged in
- [ ] `/free-valuation` + contact forms
- [ ] Property enquiry appears in `/admin` staff inbox (not email)
- [ ] Contact Us still arrives by email

## Demo mode (no Firebase yet)

If env vars are empty, the portal uses **browser localStorage** so you can still demo login/save to the client. Once Firebase env vars are set on Vercel, production switches to real accounts automatically.
