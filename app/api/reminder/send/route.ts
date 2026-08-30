import { NextResponse } from "next/server";
import { session } from "../../../../lib/auth";
import { postgresInvoiceRepository } from "../../../../lib/postgres-repository";
import { reminderFor } from "../../../../lib/domain";
import { sendReminderEmail } from "../../../../lib/email";
import { assertReminderQuota } from "../../../../lib/subscription-service";

export async function POST(request: Request) {
  try {
    const auth = await session(request);
    if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const { invoiceId } = await request.json() as { invoiceId?: string };
    if (!invoiceId) return NextResponse.json({ error: "invoiceId is required." }, { status: 400 });
    const invoice = await postgresInvoiceRepository.getById(auth.accountId, invoiceId);
    if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    await assertReminderQuota(auth.accountId);
    const message = reminderFor(invoice);
    await sendReminderEmail({ to: invoice.customerEmail, subject: `Payment reminder — ${invoice.invoiceNumber}`, text: message });
    return NextResponse.json({ sent: true, invoiceId: invoice.id });
  } catch (error) {
    console.error("reminder email failed", error);
    if ((error as { code?: string })?.code === "PLAN_LIMIT") return NextResponse.json({ error: (error as Error).message, code: "PLAN_LIMIT" }, { status: 402 });
    return NextResponse.json({ error: "Unable to send reminder." }, { status: 502 });
  }
}
