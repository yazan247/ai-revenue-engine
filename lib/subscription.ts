import { getDb } from "./db";

export type Plan = "free" | "pro" | "business";
export type Subscription = { plan: Plan; status: string; invoiceLimit: number | null; reminderLimit: number | null; automaticReminders: boolean; monthlyPriceCents: number };

export async function getSubscription(accountId: string): Promise<Subscription> {
  const { rows } = await getDb().query<Subscription>(`select s.plan, s.status, p.invoice_limit as "invoiceLimit", p.reminder_limit as "reminderLimit", coalesce((p.features->>'automatic_reminders')::boolean,false) as "automaticReminders", p.monthly_price_cents as "monthlyPriceCents" from subscriptions s join plan_catalog p on p.plan=s.plan where s.account_id=$1 limit 1`, [accountId]);
  return rows[0] ?? { plan: "free", status: "active", invoiceLimit: 5, reminderLimit: 5, automaticReminders: false, monthlyPriceCents: 0 };
}

export async function canCreateInvoice(accountId: string) {
  const sub = await getSubscription(accountId);
  if (sub.invoiceLimit === null) return { allowed: true, subscription: sub };
  const { rows } = await getDb().query<{ count: string }>(`select count(*)::text as count from invoices where account_id=$1`, [accountId]);
  const used = Number(rows[0]?.count ?? 0);
  return { allowed: used < sub.invoiceLimit, used, limit: sub.invoiceLimit, subscription: sub };
}

export async function canSendReminder(accountId: string) {
  const sub = await getSubscription(accountId);
  if (sub.reminderLimit === null) return { allowed: true, subscription: sub };
  const { rows } = await getDb().query<{ count: string }>(`select count(*)::text as count from reminder_deliveries d join invoices i on i.id=d.invoice_id where i.account_id=$1 and d.status='sent'`, [accountId]);
  const used = Number(rows[0]?.count ?? 0);
  return { allowed: used < sub.reminderLimit, used, limit: sub.reminderLimit, subscription: sub };
}
