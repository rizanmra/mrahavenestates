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

### Firestore rules (paste in Firebase)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Firebase Auth

- Authentication → Sign-in method → **Email/Password** → Enable

## 2. Add env vars on Vercel

Project → Settings → Environment Variables → add all from `.env.example`:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Redeploy after saving.

## 3. Domain (Wix / registrar)

Point DNS to Vercel (A/CNAME as shown in Vercel → Domains). Keep Wix for email if needed.

## 4. Smoke test after deploy

- [ ] Homepage + logo
- [ ] `/property-value-calculator`
- [ ] `/stamp-duty`
- [ ] `/login` register + login (Firebase)
- [ ] Save a property while logged in
- [ ] `/free-valuation` + contact forms

## Demo mode (no Firebase yet)

If env vars are empty, the portal uses **browser localStorage** so you can still demo login/save to the client. Once Firebase env vars are set on Vercel, production switches to real accounts automatically.
