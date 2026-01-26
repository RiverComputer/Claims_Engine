# Claims Engine — Local Dev Setup

This project is a Next.js App Router app that uses Prisma + Postgres and React Flow for the canvas editor.

## What This Is
- **Claims Engine** is a graph-based editor for connecting evidence to claims.
- Nodes are evidence / validation / claim (plus shape and text nodes for visual layout).
- Data is stored in **Postgres** via Prisma.
- Files/images are stored via **Vercel Blob** in production, but local dev can run without Blob unless you want uploads.

## Quick Start (Local, Safe)
This keeps your work local and **does not affect the live demo**.

### 1) Install dependencies
```bash
cd prototype2
npm install
```

### 2) Create a local Postgres DB
Create a local DB (example name: `claims_engine_dev`), then set:
```
DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/claims_engine_dev
```

Put that in `prototype2/.env.local`.

### 3) Run migrations + seed demo data
```bash
npx prisma migrate dev
npx prisma db seed
```

### 4) Run the app
```bash
npm run dev
```

Open http://localhost:3000

## Optional: Blob uploads in local dev
If you want uploads to go to Vercel Blob (instead of local `/uploads`), add:
```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```
to `.env.local`.

## How the app works (very short)
- **Next.js App Router** serves the UI and API routes.
- **Prisma** handles DB access.
- **React Flow** renders nodes/edges in the canvas.
- **API routes** live in `app/api/*`.
- **Graph types** live in `lib/types/graph.ts`.
- **File handling** uses `lib/storage/file-store.ts`.

## Dev vs Live Demo (important)
- **Local Postgres** = safe, isolated.
- **Vercel Postgres** = shared; changes affect the live demo.
- If you do use Vercel DB, you can overwrite demo data, so it’s not recommended for dev work.

## Common commands
```bash
npm run dev
npx prisma migrate dev
npx prisma db seed
```

## Troubleshooting
- If images don’t show, check that `fileRef`/`thumbnailRef` are valid URLs.
- If node creation fails, check `app/api/nodes/route.ts` and ensure the node type is allowed.


