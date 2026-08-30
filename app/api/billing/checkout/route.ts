import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { session } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { createPaymentCheckout, type CheckoutPlan } from "../../../../lib/payment-adapter";

const PRICES: Record<CheckoutPlan, { amountCents: number; currency: string }> = {
  pro: { amountCents: 900, currency: "USD" },
  business: { amountCents: 1900, currency: "USD" },
};

export async function POST(request: Request) {
  const auth = await session(request);
  if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: { plan?: CheckoutPlan };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const plan = body.plan;
  if (plan !== "pro" && plan !== "business") return NextResponse.json({ error: "Invalid plan." }, { status: 400 });

  const db = getDb();
  const price = PRICES[plan];
  const { rows: existing } = await db.query(`select id, status from billing_events where account_id=$1 and event_type='payment_requested' and status='pending_payment' and payload->>'plan'=$2 and created_at > now() - interval '24 hours' order by created_at desc limit 1`, [auth.accountId, plan]);
  if (existing[0]) return NextResponse.json({ requestId: existing[0].id, status: "pending_payment", message: "You already have a pending payment request for this plan." });

  const providerEventId = `checkout_${randomUUID()}`;
  const { rows } = await db.query(`insert into billing_events (account_id, event_type, provider, provider_event_id, status, amount_cents, currency, payload) values ($1,'payment_requested','iyzico-link',$2,'pending_payment',$3,$4,$5::jsonb) returning id, created_at as "createdAt"`, [auth.accountId, providerEventId, price.amountCents, price.currency, JSON.stringify({ plan, source: "pricing_checkout", providerEventId })]);
  const requestId = rows[0].id;
  try {
    const checkout = await createPaymentCheckout(plan);
    await db.query(`update billing_events set provider_reference=$1, payload=payload || $2::jsonb where id=$3`, [checkout.checkoutUrl, JSON.stringify({ checkoutReady: true }), requestId]);
    return NextResponse.json({ requestId, status: "pending_payment", ...checkout });
  } catch {
    await db.query(`update billing_events set status='payment_link_unavailable', payload=payload || $1::jsonb where id=$2`, [JSON.stringify({ checkoutReady: false }), requestId]);
    return NextResponse.json({ requestId, status: "payment_link_unavailable", error: "Payment links are not configured yet." }, { status: 503 });
  }
}
