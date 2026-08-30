import { NextResponse } from "next/server";
import { session } from "../../../lib/auth";
import { getSubscription } from "../../../lib/subscription";

export async function GET(request: Request) {
  const auth = await session(request);
  if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { return NextResponse.json({ subscription: await getSubscription(auth.accountId) }); }
  catch (error) { console.error("billing lookup failed", error); return NextResponse.json({ error: "Unable to load billing." }, { status: 503 }); }
}
