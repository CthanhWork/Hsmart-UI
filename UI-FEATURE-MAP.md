# H-Smart UI Feature Map

The UI exposes only browser-facing backend capabilities.

| UI route | Backend capability |
| --- | --- |
| `/` | Product catalog, category filtering, product search |
| `/products/:id` | Product detail, seller reviews, wishlist, order creation, reports |
| `/sell` | Image analysis, Smart Naming, Smart Pricing, AI description, product creation |
| `/products/:id/edit` | Product update and seller-managed status |
| `/listings` | Seller listings and product deletion |
| `/profile` | Read and update user profile |
| `/wishlist` | Saved products |
| `/orders` | Order lookup, seller confirmation, buyer completion, seller review |
| `/notifications` | User notifications |
| `/chat` | Product conversation history and STOMP messaging |
| `/admin` | Overview stats, product moderation, reports, user bans, categories |

## Intentional exclusions

- Internal service endpoints, health checks, service discovery, and webhooks are not UI features.
- Order-service currently has no user-facing order list endpoint. The UI remembers order IDs created or opened in the current browser and supports direct lookup.
- The UI does not display invented seller metrics, product diagnostics, shipping promises, revenue trends, or marketing pages that are absent from backend responses.
