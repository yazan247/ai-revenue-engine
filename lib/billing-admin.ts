import { getDb } from "./db";
import { Plan } from "./subscription";

export async function listPendingPayments() {
  const { rows } = await getDb().query(`select id, account_id as "accountId", plan, status, amount_cents as "amountCents", currency, provider, provider_reference as "providerReference", created_at as "createdAt" from billing_events where status='pending_payment' order by created_at asc`);
  return rows;
}

export async function approvePayment(eventId: string, adminId: string) {
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query('begin');
    const { rows } = await client.query(`select id, account_id, plan, status from billing_events where id=$1 for update`, [eventId]);
    const event = rows[0];
    if (!event) throw new Error("Payment request not found.");
    if (event.status !== "pending_payment") throw new Error("Payment request is no longer pending.");
    if (!["pro", "business"].includes(event.plan as string)) throw new Error("Invalid paid plan.");
    await client.query(`update subscriptions set plan=$1, status='active', updated_at=now() where account_id=$2`, [event.plan as Plan, event.account_id]);
    await client.query(`update billing_events set status='paid', reviewed_by=$1, reviewed_at=now() where id=$2`, [adminId, eventId]);
    await client.query(`insert into billing_events (account_id, plan, status, amount_cents, currency, provider, provider_reference, reviewed_by, reviewed_at) values ($1,$2,'plan_activated',$3,$4,$5,$6,$7,now())`, [event.account_id,event.plan,event.amount_cents,event.currency,event.provider,event.provider_reference,adminId]);
    await client.query('commit');
  } catch (e) { await client.query('rollback'); throw e; } finally { client.release(); }
}

export async function rejectPayment(eventId: string, adminId: string) {
  const { rowCount } = await getDb().query(`update billing_events set status='rejected', reviewed_by=$1, reviewed_at=now() where id=$2 and status='pending_payment'`, [adminId,eventId]);
  if (!rowCount) throw new Error("Payment request not found or already reviewed.");
}
