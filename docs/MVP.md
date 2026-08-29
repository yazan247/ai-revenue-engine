# InvoicePilot MVP Specification

## User
Small service businesses: freelancers, agencies, repair companies, consultants, and local contractors.

## Core problem
Owners lose time chasing overdue invoices and often send inconsistent reminders.

## Core workflow
1. Add customer.
2. Create invoice with amount, issue date, due date, and status.
3. Dashboard highlights upcoming and overdue invoices.
4. User selects a reminder stage.
5. InvoicePilot generates a concise, professional message using invoice context.
6. User can copy/send the message through their existing email system in the first MVP.

## Data model
Customer: id, name, email, company, created_at.
Invoice: id, customer_id, invoice_number, amount, currency, issue_date, due_date, status, notes, created_at.
Reminder: id, invoice_id, stage, generated_message, created_at.

## Initial reminder stages
- Friendly upcoming reminder
- Due today
- 3 days overdue
- 7 days overdue
- 14 days overdue

## Guardrails
- Never claim a payment was received unless the invoice status says paid.
- Never invent invoice numbers, amounts, dates, or customer details.
- Keep generated messages professional and non-threatening.
- User reviews messages before sending in MVP.

## Monetization hypothesis
Free tier for limited active invoices; paid tier for higher limits and automated follow-up integrations after validation.

## Success metric
Primary: percentage of activated users who create at least one invoice and return to create or generate a follow-up for another invoice.
