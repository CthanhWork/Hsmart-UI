# H-Smart Frontend Deployment Note

Updated: 2026-07-09 (Asia/Saigon)  
Workspace: `D:\H-smart UI`

## 1) Current production target

Production is served from VPS + nginx, not Vercel.

- Public site: `https://hsmart.thatcherdev.id.vn`
- SSH user: `hoangchithanh23072003@100.110.169.59`
- SSH key: `~/.ssh/id_rsa_hsmart_new`
- Live static root: `/var/www/h-smart-ui`
- Browser API base: `/api/v1`
- Backend gateway behind nginx: `http://127.0.0.1:8000`

Nginx responsibilities:

- `/` serves the React static bundle
- SPA routes such as `/search`, `/admin`, `/verify-email`, `/reset-password` fall back to `index.html`
- `/api/v1/*` proxies to the backend gateway

## 2) Required production env

Always build the frontend with:

```env
VITE_API_BASE_URL=/api/v1
VITE_USE_MOCK=false
```

Do not build production with any direct backend hostname such as the old `tail0e1958.ts.net` endpoint.

## 3) Current deploy flow

### Local build

From `D:\H-smart UI`:

```bash
npm run build
```

If `dist` is locked on Windows, build to a temporary folder instead:

```bash
npx vite build --outDir dist-deploy
```

### Upload to VPS

Use the built static output and copy it to `/var/www/h-smart-ui`:

```bash
scp -i ~/.ssh/id_rsa_hsmart_new -r dist/* \
  hoangchithanh23072003@100.110.169.59:/var/www/h-smart-ui/
```

If you built to `dist-deploy`, upload that folder instead of `dist`.

### Reload nginx if needed

```bash
ssh -i ~/.ssh/id_rsa_hsmart_new hoangchithanh23072003@100.110.169.59 \
  "sudo systemctl reload nginx"
```

## 4) Verify after deploy

Minimum checks:

- `https://hsmart.thatcherdev.id.vn` loads
- `index.html` on the VPS points to the new hashed JS/CSS bundle
- the served bundle no longer contains old hostnames like `tail0e1958.ts.net`
- browser requests go to same-origin `/api/v1/*`
- `/admin` opens normally after login

Useful live checks:

```bash
ssh -i ~/.ssh/id_rsa_hsmart_new hoangchithanh23072003@100.110.169.59 \
  "ls -1 /var/www/h-smart-ui/assets | tail"

ssh -i ~/.ssh/id_rsa_hsmart_new hoangchithanh23072003@100.110.169.59 \
  "curl -I http://127.0.0.1:8000/health"
```

## 5) Notes that matter

- The old VPS `root@100.66.247.41` is historical only.
- Production now uses the new VPS at `100.110.169.59`.
- The frontend admin dashboard charts now intentionally render a zero series when `system_ledger` is empty, so an empty card is no longer expected.
- If the UI still looks stale after deploy, check browser cache and confirm the public `index.html` really changed.

## 6) Quick SSH reminder

```bash
ssh -i ~/.ssh/id_rsa_hsmart_new hoangchithanh23072003@100.110.169.59
```

Then:

```bash
cd /home/hoangchithanh23072003/h-smart
docker compose -f docker-compose.yml ps
```

## 7) Safe rollback mindset

- Keep `.env` on the VPS unchanged unless you are intentionally rotating config.
- Do not publish database ports.
- Back up before any risky sync or overwrite.
- Prefer verifying the live `index.html` and bundle hash instead of assuming a local build is already live.
