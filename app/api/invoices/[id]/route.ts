import { NextResponse } from "next/server";
import { updateInvoiceStatus } from "../../../../lib/invoice-service";
import type { Invoice, InvoiceStatus } from "../../../../lib/domain";

// Development-only in-memory store. Replace with the authenticated repository adapter before production.
const invoices: Invoice[] = [];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json() as { status?: InvoiceStatus };
    if (!body.status || !["overdue", "due_soon", "paid"].includes(body.status)) {
      return NextResponse.json({ error: "A valid status is required." }, { status: 400 });
    }
    const updated = updateInvoiceStatus(invoices, id, body.status)[0];
    if (!updated || updated.id !== id) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    const index = invoices.findIndex(i => i.id === id);
    invoices[index] = updated;
    return NextResponse.json({ invoice: updated });
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = invoices.findIndex(i => i.id === id);
  if (index < 0) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  invoices.splice(index, 1);
  return new NextResponse(null, { status: 204 });
}
