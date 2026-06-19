# H-Smart UI

React and Vite frontend connected to the H-Smart API Gateway.

## Backend Configuration

Create `.env.local` from `.env.example`:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

For local development, point `VITE_API_BASE_URL` at your reachable API Gateway.
For Vercel production, prefer `VITE_API_BASE_URL=/api/v1` and let `vercel.json` rewrite `/api/*`
to the deployed backend. This keeps browser traffic same-origin and avoids client-side issues when
the upstream API is exposed through Tailscale Funnel.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run build
```

## Implemented Workflows

- Authentication and profile management
- Product catalog, search, categories, wishlist, and seller listings
- Smart Naming, Smart Pricing, AI descriptions, and product creation
- Product update and deletion
- Order creation, lookup, confirmation, completion, and reviews
- Reports, notifications, product chat, and AI assistant
- Admin statistics, moderation, report handling, user bans, and category creation

See [UI-FEATURE-MAP.md](./UI-FEATURE-MAP.md) for the route-to-backend mapping and intentional exclusions.

The order page uses direct lookup and remembers recently opened order IDs because order-service does not currently expose a user-facing order list endpoint.
