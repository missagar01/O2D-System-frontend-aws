# O2D Frontend Deployment

## Required environment variables
- `NEXT_PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_AUTH_BASE_URL`: Client-facing API base. Use `/api` to go through the Next.js proxy.
- `API_PROXY_TARGET`: Origin URL that `/api/*` should proxy to (e.g. `http://localhost:3006` locally or your production API host on Vercel/AWS).
- `ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_CONNECTION_STRING`: Oracle credentials for the server-side route (`app/api/pending`).
- `ORACLE_CLIENT_MODE`: `thin` (default, works on Vercel/serverless) or `thick` when an Instant Client is available.
- `ORACLE_CLIENT_LIB_DIR`: Path to the Instant Client when using thick mode (skip on Vercel/serverless).
- `PORT`: Local dev server port (default `3006`).

## Local development
1) Copy `.env.example` to `.env.local` and fill values. Set `API_PROXY_TARGET=http://localhost:3006` (or your local backend).
2) Install deps: `npm install`.
3) Start dev server: `npm run dev` and ensure your backend/API is reachable at the proxy target.

## Vercel
- Set env vars in the Vercel dashboard: `NEXT_PUBLIC_API_BASE_URL=/api`, `NEXT_PUBLIC_AUTH_BASE_URL=/api`, `API_PROXY_TARGET=https://your-api.example.com`.
- Keep `ORACLE_CLIENT_MODE=thin`; provide Oracle credentials only if you need the built-in `/api/pending` route.
- Deploy normally; the Next.js rewrite will proxy `/api/*` to your `API_PROXY_TARGET`.

## AWS (EC2/ECS/Beanstalk)
1) Provide the same env vars as above (proxy target set to your backend).
2) Build and run:
   - `npm ci`
   - `npm run build`
   - `npm run start` (set `PORT` as needed; ensure the security group/load balancer forwards traffic).

## Notes
- Generated artifacts (`.next`, `.DS_Store`) were removed; they stay git-ignored.
- Keep secrets out of git by using `.env.local` or platform env managers.
