# Vercel deploy log

Last updated: 2026-06-19 (Asia/Saigon)  
Workspace: `D:\H-smart UI`

## Project binding

- Project name: `h-smart-ui`
- Vercel project ID: `prj_Xj4Iqkzq7mP572fsnOozUU0X4sJ4`
- Vercel org/team ID: `team_4G65xgbcu92WdIj8AY2sDTcg`

- [.vercel/project.json](D:/H-smart UI/.vercel/project.json)

Contents:

```json
{"projectId":"prj_Xj4Iqkzq7mP572fsnOozUU0X4sJ4","orgId":"team_4G65xgbcu92WdIj8AY2sDTcg","projectName":"h-smart-ui"}
```

## Current production deployment

- Commit deployed: `local workspace deploy`
- Deployment ID: `dpl_7BN7Kcu5ufJKaecqXqZjt9H8GsTW`
- Production deployment URL: `https://h-smart-y9trvmn3n-thatcher1.vercel.app`
- Production alias: `https://h-smart-ui.vercel.app`
- Custom domain: `https://hsmart.thatcherdev.id.vn`
- Deployment state: `READY`
- Verified on: 2026-06-19

## Environment variables in use

These are frontend `VITE_*` variables, so they are client-visible by design.

### Production

- `VITE_API_BASE_URL=/api/v1`
- `VITE_USE_MOCK=false`

### Preview (`develop`)

- `VITE_API_BASE_URL=/api/v1`
- `VITE_USE_MOCK=false`

### Development

- `VITE_API_BASE_URL=/api/v1`
- `VITE_USE_MOCK=false`

## Vercel routing config

File:

- [vercel.json](D:/H-smart UI/vercel.json)

Contents:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://instance-20260601-031713.tail0e1958.ts.net/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Meaning:

- Browser requests to `/api/*` stay same-origin on the frontend domain
- Vercel proxies `/api/*` to the backend gateway through the Funnel URL
- SPA routes such as `/verify-email` and `/reset-password` are rewritten to `index.html`
- React Router handles the final route on the client

## Backend target expected by frontend

- API Gateway public entry: `https://instance-20260601-031713.tail0e1958.ts.net`
- Frontend API base in browser: `/api/v1`
- Vercel upstream target for `/api/*`: `https://instance-20260601-031713.tail0e1958.ts.net/api/*`
- Backend `FRONTEND_BASE_URL` on VPS: `https://hsmart.thatcherdev.id.vn`
- Backend allowed origins include:
  - `http://localhost:3000`
  - `http://localhost:5173`
  - `https://hsmart.thatcherdev.id.vn`
  - `https://instance-20260601-031713.tail0e1958.ts.net`

## VPS public access note

The VPS currently exposes the gateway through Tailscale Funnel:

- Funnel URL: `https://instance-20260601-031713.tail0e1958.ts.net`
- Funnel target: `http://127.0.0.1:8000`

Checked status on VPS:

- `docker compose -f docker-compose-gcp.yml ps` shows `api-gateway` healthy
- `curl http://127.0.0.1:8000/health` returned `200`

## Quick verification checklist

- `https://hsmart.thatcherdev.id.vn` loads
- `https://hsmart.thatcherdev.id.vn/verify-email` returns the new frontend bundle
- `https://hsmart.thatcherdev.id.vn/reset-password` returns the new frontend bundle
- Clicking a verification link shows a success state instead of `Failed to fetch`
- Production bundle contains:
  - `verify-email`
  - `reset-password`
  - `/api/v1`

## Deploy commands used

```bash
git push origin develop
vercel --prod --yes
vercel inspect h-smart-ui.vercel.app
vercel env ls
```

## Notes

- This file intentionally does not store temporary tokens such as `VERCEL_OIDC_TOKEN`.
- The `Failed to fetch` issue on verification/reset routes was fixed by moving the browser-facing API base to same-origin `/api/v1` and letting Vercel rewrite to the Funnel URL.
