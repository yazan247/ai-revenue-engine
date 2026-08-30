import { getDb } from "./db";

export async function listPendingPayments() {
  const { rows } = await getDb().query(`select id, account_id as "accountId", payload->>'plan' as plan, status, amount_cents as "amountCents", currency, provider, provider_reference as "providerReference", created_at as "createdAt" from billing_events where status='pending_payment' and event_type='payment_requested' order by created_at asc`);
  return rows;
}

export async function approvePayment(eventId: string, adminId: string) {
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query('begin');
    const { rows } = await client.query(`select id, account_id, payload->>'plan' as plan, status, amount_cents, currency, provider, provider_reference from billing_events where id=$1 for update`, [eventId]);
    const event = rows[0];
    if (!event) throw new Error("Payment request not found.");
    if (event.status !== "pending_payment") throw new Error("Payment request is no longer pending.");
    if (event.plan !== "pro" && event.plan !== "business") throw new Error("Invalid paid plan.");

    const sub = await client.query(`update subscriptions set plan=$1, status='active', updated_at=now() where account_id=$2`, [event.plan, event.account_id]);
    if (sub.rowCount !== 1) throw new Error("Subscription record not found.");

    await client.query(`update billing_events set status='paid', reviewed_by=$1, reviewed_at=now(), processed_at=now() where id=$2 and status='pending_payment'`, [adminId, eventId]);
    await client.query(`insert into billing_events (id, provider, provider_event_id, event_type, account_id, payload, processed_at) values (gen_random_uuid(),$1,$2,'plan_activated',$3,$4::jsonb,now())`, [event.provider, `manual-activation-${eventId}`, event.account_id, JSON.stringify({ plan: event.plan, sourceEventId: eventId, amountCents: event.amount_cents, currency: event.currency, providerReference: event.provider_reference, reviewedBy: adminId })]);
    await client.query('commit');
  } catch (e) { await client.query('rollback'); throw e; } finally { client.release(); }
}

export async function rejectPayment(eventId: string, adminId: string) {
  const { rowCount } = await getDb().query(`update billing_events set status='rejected', reviewed_by=$1, reviewed_at=now(), processed_at=now() where id=$2 and status='pending_payment' and event_type='payment_requested'`, [adminId,eventId]);
  if (!rowCount) throw new Error("Payment request not found or already reviewed.");
}
