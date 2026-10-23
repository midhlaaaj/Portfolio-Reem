# Reem portfolio env

The portfolio needs 14 environment variables in production: 12 required and 2 optional. Put them in `.env.local` for local work and in Vercel under Project Settings, Environment Variables.

This file lists names and where each value comes from, never the secret values themselves. Keep real secrets out of chat, email and Git. A blank template is in `.env.example`.

## Variables

| Key | What it is | Where the value comes from | Required |
| --- | --- | --- | --- |
| `DATABASE_URL` | Neon Postgres connection | Neon console, Connect, the pooled string (host contains `-pooler`) | Yes |
| `AUTH_SECRET` | Signs admin login sessions | Generate: `openssl rand -base64 32` | Yes |
| `ADMIN_EMAIL` | The one admin login email | Your choice, currently `reemfathima66@gmail.com` | Yes |
| `ADMIN_PASSWORD_HASH` | Hashed admin password | Run `npm run admin:hash -- "your password"`, copy the line it prints | Yes |
| `AWS_ENDPOINT_URL_S3` | Neon object storage endpoint | Neon console, Object storage, Connect | Yes |
| `AWS_ACCESS_KEY_ID` | Storage access key | Neon console, Object storage, Connect | Yes |
| `AWS_SECRET_ACCESS_KEY` | Storage secret key | Neon console, Object storage, Connect | Yes |
| `AWS_REGION` | Storage region | Shown with the endpoint, `ap-southeast-1` | Yes |
| `S3_BUCKET` | Bucket name | The bucket you created, `uploads` | Yes |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Contact form spam check, public key | Cloudflare dashboard, Turnstile, your site | Yes |
| `TURNSTILE_SECRET_KEY` | Contact form spam check, secret key | Same Turnstile site, secret key | Yes |
| `NEXT_PUBLIC_SITE_URL` | Live site address, no trailing slash | Your domain, for example `https://yourname.com` | Yes |
| `NEXT_PUBLIC_ADMIN_TZ` | Time zone for admin dates | Defaults to `Asia/Kolkata` | No |
| `DB_POOL_MAX` | Max database connections | Defaults to 10 on Neon, 1 locally | No |

## Notes

- **Rotate anything pasted into chat.** The first Neon database password was shared in a conversation, so reset it in Neon and use the new connection string.
- **Local and Vercel are separate.** Vercel does not read `.env.local`. Add every key above to Vercel, then redeploy.
- **Local database.** If `DATABASE_URL` points at `127.0.0.1`, the app uses the local test database. Switch it to the Neon string to work against real data.
- **Restart after changes.** A running server reads these values only when it starts.
- **Password hash.** The hash is base64 text, so it pastes safely into Vercel. Changing the admin password means generating a new hash and updating this one variable.
- **Storage is private.** The bucket is not public. The app reads from it and serves images at `/files/...`, so no public URL variable is needed.
- **Region.** `vercel.json` runs the site in Singapore (`sin1`), next to the Neon database.
