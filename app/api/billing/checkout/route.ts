import { NextResponse } from "next/server";
import { session } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { createPaymentCheckout, type CheckoutPlan } from "../../../../lib/payment-adapter";

export async function POST(request: Request) {
  const auth = await session(request);
  if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { plan } = await request.json() as { plan?: CheckoutPlan };
  if (plan !== "pro" && plan !== "business") return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  const { rows } = await getDb().query(`insert into billing_events (account_id, event_type, provider, external_event_id, payload) values ($1,'payment_requested','iyzico-link',gen_random_uuid()::text,$2::jsonb) returning id`, [auth.accountId, JSON.stringify({ plan })]);
  try {
    const checkout = await createPaymentCheckout(plan);
    return NextResponse.json({ requestId: rows[0].id, ...checkout });
  } catch {
    return NextResponse.json({ error: "Payment links are not configured yet." }, { status: 503 });
  }
}
