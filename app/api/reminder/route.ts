import { NextResponse } from "next/server";
import { reminderFor, type ReminderStage } from "../../../lib/domain";
import { session } from "../../../lib/auth";
import { postgresInvoiceRepository } from "../../../lib/postgres-repository";
import { sendReminderEmail } from "../../../lib/email";

export async function POST(request: Request) {
  try {
    const auth = await session(request);
    if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const body = await request.json() as { invoiceId?: string; stage?: ReminderStage; send?: boolean };
    if (!body.invoiceId) return NextResponse.json({ error: "invoiceId is required." }, { status: 400 });
    const invoice = await postgresInvoiceRepository.getById(auth.accountId, body.invoiceId);
    if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });

    const message = reminderFor(invoice, body.stage);
    if (!body.send) return NextResponse.json({ message, sent: false });

    await sendReminderEmail({
      to: invoice.customerEmail,
      subject: `Payment reminder — ${invoice.invoiceNumber}`,
      text: message,
    });
    return NextResponse.json({ message, sent: true });
  } catch (error) {
    console.error("reminder request failed", error);
    return NextResponse.json({ error: "Unable to process reminder." }, { status: 502 });
  }
}
