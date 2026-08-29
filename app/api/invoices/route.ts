import { NextResponse } from "next/server";
import { createInvoice } from "../../../lib/invoice-service";
import type { Invoice } from "../../../lib/domain";

// Temporary development repository. Replace with an authenticated server-side
// repository before enabling multi-user production access.
const invoices: Invoice[] = [];

export async function GET() {
  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { customerName?: string; customerEmail?: string; amount?: number; dueDate?: string; currency?: string };
    if (!body.customerName?.trim() || !body.customerEmail?.trim() || !body.amount || body.amount <= 0 || !body.dueDate) {
      return NextResponse.json({ error: "customerName, customerEmail, positive amount and dueDate are required." }, { status: 400 });
    }
    const invoice = createInvoice({ customerName: body.customerName, customerEmail: body.customerEmail, amount: body.amount, dueDate: body.dueDate, currency: body.currency }, invoices);
    invoices.unshift(invoice);
    return NextResponse.json({ invoice }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }
}
