import { NextResponse } from "next/server";
import { postgresInvoiceRepository } from "../../../../lib/postgres-repository";
import type { InvoiceStatus } from "../../../../lib/domain";

// Temporary development account until authentication is installed.
const DEV_ACCOUNT_ID = "development-account";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json() as { status?: InvoiceStatus };
    if (!body.status || !["overdue", "due_soon", "paid"].includes(body.status)) {
      return NextResponse.json({ error: "A valid status is required." }, { status: 400 });
    }
    const invoice = await postgresInvoiceRepository.updateStatus(DEV_ACCOUNT_ID, id, body.status);
    if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("PATCH /api/invoices/[id] failed", error);
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const removed = await postgresInvoiceRepository.remove(DEV_ACCOUNT_ID, id);
    if (!removed) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/invoices/[id] failed", error);
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }
}
