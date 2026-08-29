import { NextResponse } from "next/server";
import { memoryInvoiceRepository } from "../../../../lib/memory-repository";
import type { InvoiceStatus } from "../../../../lib/domain";

const DEV_ACCOUNT_ID = "development-account";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json() as { status?: InvoiceStatus };
    if (!body.status || !["overdue", "due_soon", "paid"].includes(body.status)) {
      return NextResponse.json({ error: "A valid status is required." }, { status: 400 });
    }
    const invoice = await memoryInvoiceRepository.updateStatus(DEV_ACCOUNT_ID, id, body.status);
    if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    return NextResponse.json({ invoice });
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const removed = await memoryInvoiceRepository.remove(DEV_ACCOUNT_ID, id);
  if (!removed) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
