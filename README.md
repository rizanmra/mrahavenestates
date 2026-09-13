# MRA Haven Estates

Custom Next.js website for MRA Haven Estates — sales, lettings, removals and valuations nationwide across the UK.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key features

- Brand logo in header, footer and favicon
- **Property value calculator** (`/property-value-calculator`) — SEO tool for organic traffic
- Stamp duty calculator (`/stamp-duty`)
- Client portal (login, saved properties, account)
- Demo auth via browser storage; **Firebase Auth + Firestore** when env vars are set

## Deploy / go-live

See **[GO_LIVE.md](./GO_LIVE.md)** for the office checklist (client Vercel + Firebase).

1. Copy `.env.example` → `.env.local` (or Vercel env vars) when Firebase is ready
2. Import GitHub repo into the **client’s** Vercel account
3. Point domain DNS to Vercel

Without Firebase keys, the portal still works in **demo mode** for client presentations.

## Design

- Navy (`#0B1E33`) and gold (`#C4A47C`)
- Serif headings (Cormorant Garamond) + sans body (Outfit)

## Repo

[https://github.com/9say9/mra-haven-estates](https://github.com/9say9/mra-haven-estates)
