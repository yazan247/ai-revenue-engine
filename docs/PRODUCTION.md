# Production architecture

InvoicePilot is currently a browser-first MVP. The next production boundary is now explicit:

- UI: Next.js App Router
- Domain: provider-independent TypeScript services
- Reminder API: `POST /api/reminder`
- Persistence: replace `lib/storage.ts` with a server-side repository after authentication
- Authentication: add before exposing customer/invoice data to multiple users
- Email: add a provider only after user consent and billing/limits are defined
- Billing: add subscription checks server-side, never in client code

## Security rules

1. Never put provider secrets in client components.
2. Validate every API payload on the server.
3. Scope database queries to the authenticated account.
4. Treat generated reminder text as untrusted output and require user review until delivery controls are production-ready.
5. Do not automatically send messages to contacts without explicit user configuration.
