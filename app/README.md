# InvoicePilot App

The MVP dashboard is implemented in this directory. The current release is intentionally local-first: invoice records are kept in client state so the workflow can be validated before adding authentication, database, email delivery, and billing infrastructure.

Next production layers:
1. Persistent database
2. Authentication
3. Server-side AI generation
4. Email delivery with user approval controls
5. Subscription billing
