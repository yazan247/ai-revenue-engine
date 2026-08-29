# Application layers

- `domain.ts` contains invoice types, money formatting, and deterministic reminder generation.
- `storage.ts` provides the temporary browser persistence adapter used by the MVP.

The next replacement for `storage.ts` should be a server-side database adapter behind authentication. Keep the domain types independent from the database provider so the product can migrate providers without rewriting the UI.