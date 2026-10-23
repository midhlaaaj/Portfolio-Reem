# Reem Fathima portfolio

Next.js 16 (App Router, TypeScript), CSS Modules, GSAP + Lenis, Neon Postgres + Drizzle, S3-compatible media storage, Auth.js (single admin), Cloudflare Turnstile.

The design source of truth is in `design/` (`Home.dc.html`, `Admin.dc.html`). Public components in `src/components/site/` were generated from it and wired to data; the admin is in `src/app/admin/`.

## Run locally

```bash
npm install
npm run db:dev          # terminal 1: local Postgres stand-in (PGlite) on :5433
npm run db:migrate      # create tables
npm run db:seed         # load the design's content (use -- --force to reset)
npm run admin:hash -- "your password"   # paste the output line into .env.local
npm run dev             # terminal 2
```

Copy `.env.example` to `.env.local`. With `DATABASE_URL` pointing at `127.0.0.1` the app uses the local stand-in; leave the storage and Turnstile keys empty and uploads go to `public/uploads` and the spam check is skipped. Admin: `/admin`.

## Deploy (Vercel + Neon)

1. Create a Neon project; set `DATABASE_URL`. Run `npm run db:migrate` and `npm run db:seed` once against it.
2. Enable Object storage in the Neon project. Set `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` (as shown in Neon) and `S3_BUCKET` (default `assets`). The bucket stays private; the app serves files at `/files/...`.
3. Turnstile site: set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. In production the contact form **rejects** messages if the secret is missing.
4. `AUTH_SECRET` (`openssl rand -base64 32`), `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (from `npm run admin:hash`, base64, safe in any env UI), `NEXT_PUBLIC_SITE_URL` (the live URL, used for canonical/OG/sitemap).
5. Public pages are static and refresh on every admin save (`revalidatePath`).

## Notes and deliberate decisions

- Seeded testimonials are the design's placeholders and are seeded **hidden**.
- The Home brands strip, What I do services, How I work steps, About skills, projects, testimonials and categories are all editable in the admin. Fixed wording (headings, button labels) lives in `src/content/copy.ts`.
- Images render through `next/image`'s optimiser via `getImageProps` (plain `<img>` on the server, no hydration cost).
- Uploads are resized in the browser (≤2400px) then re-encoded to WebP by `sharp`; limit 4 MB (Vercel body limit). CV PDF limit 2.5 MB.
