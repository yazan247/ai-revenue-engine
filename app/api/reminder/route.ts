import { NextResponse } from "next/server";
import { reminderFor, type Invoice, type ReminderStage } from "../../../lib/domain";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { invoice?: Invoice; stage?: ReminderStage };
    if (!body.invoice?.customerName || !body.invoice?.invoiceNumber || !body.invoice?.amount) {
      return NextResponse.json({ error: "A valid invoice is required." }, { status: 400 });
    }
    return NextResponse.json({ message: reminderFor(body.invoice, body.stage) });
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }
}
