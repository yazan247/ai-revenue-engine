import { NextResponse } from "next/server";
import { session } from "../../../../lib/auth";
import { approvePayment, listPendingPayments, rejectPayment } from "../../../../lib/billing-admin";

function isAdmin(request: Request) {
  const ids = (process.env.ADMIN_ACCOUNT_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean);
  return async () => { const s = await session(request); return s && ids.includes(s.accountId) ? s : null; };
}

export async function GET(request: Request) {
  const auth = await isAdmin(request)();
  if (!auth) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  return NextResponse.json({ payments: await listPendingPayments() });
}

export async function POST(request: Request) {
  const auth = await isAdmin(request)();
  if (!auth) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  try {
    const { eventId, action } = await request.json() as { eventId?: string; action?: "approve" | "reject" };
    if (!eventId || !action) return NextResponse.json({ error: "eventId and action are required." }, { status: 400 });
    if (action === "approve") await approvePayment(eventId, auth.accountId);
    else await rejectPayment(eventId, auth.accountId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to review payment." }, { status: 409 });
  }
}
