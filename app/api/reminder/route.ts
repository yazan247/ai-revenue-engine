import { NextResponse } from "next/server";
import { reminderFor, type ReminderStage } from "../../../lib/domain";
import { session } from "../../../lib/auth";
import { postgresInvoiceRepository } from "../../../lib/postgres-repository";

export async function POST(request: Request) {
  try {
    const auth = await session(request);
    if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const body = await request.json() as { invoiceId?: string; stage?: ReminderStage };
    if (!body.invoiceId) return NextResponse.json({ error: "invoiceId is required." }, { status: 400 });
    const invoice = await postgresInvoiceRepository.getById(auth.accountId, body.invoiceId);
    if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    return NextResponse.json({ message: reminderFor(invoice, body.stage) });
  } catch (error) {
    console.error("reminder generation failed", error);
    return NextResponse.json({ error: "Unable to generate reminder." }, { status: 500 });
  }
}
