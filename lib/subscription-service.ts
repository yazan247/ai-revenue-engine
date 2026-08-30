import { getDb } from "./db";

export type Plan = "free" | "pro" | "business";
export type Subscription = { plan: Plan; status: string; invoiceLimit: number | null; reminderLimit: number | null; automaticReminders: boolean };

export async function getSubscription(accountId: string): Promise<Subscription> {
  const { rows } = await getDb().query<Subscription>(`
    select s.plan, s.status,
      p.invoice_limit as "invoiceLimit",
      p.reminder_limit as "reminderLimit",
      coalesce((p.features->>'automatic_reminders')::boolean, false) as "automaticReminders"
    from subscriptions s
    join plan_catalog p on p.plan = s.plan
    where s.account_id = $1 limit 1`, [accountId]);
  if (!rows[0]) throw new Error("Subscription is not configured for this account.");
  return rows[0];
}

export async function assertInvoiceQuota(accountId: string) {
  const subscription = await getSubscription(accountId);
  if (subscription.invoiceLimit === null) return subscription;
  const { rows } = await getDb().query<{ count: string}>(`select count(*)::text as count from invoices where account_id = $1`, [accountId]);
  if (Number(rows[0]?.count ?? 0) >= subscription.invoiceLimit) {
    const error = new Error(`Invoice limit reached for the ${subscription.plan} plan.`);
    (error as Error & { code?: string }).code = "PLAN_LIMIT";
    throw error;
  }
  return subscription;
}

export async function assertReminderQuota(accountId: string) {
  const subscription = await getSubscription(accountId);
  if (subscription.reminderLimit === null) return subscription;
  const { rows } = await getDb().query<{ count: string}>(`
    select count(*)::text as count from reminder_deliveries r
    join invoices i on i.id = r.invoice_id where i.account_id = $1`, [accountId]);
  if (Number(rows[0]?.count ?? 0) >= subscription.reminderLimit) {
    const error = new Error(`Reminder limit reached for the ${subscription.plan} plan.`);
    (error as Error & { code?: string }).code = "PLAN_LIMIT";
    throw error;
  }
  return subscription;
}

export async function assertAutomaticReminders(accountId: string) {
  const subscription = await getSubscription(accountId);
  if (!subscription.automaticReminders) {
    const error = new Error("Automatic reminders require a Pro or Business plan.");
    (error as Error & { code?: string }).code = "PLAN_REQUIRED";
    throw error;
  }
  return subscription;
}
