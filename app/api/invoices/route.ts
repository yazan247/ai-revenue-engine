import { NextResponse } from "next/server";
import { createInvoice } from "../../../lib/invoice-service";
import { memoryInvoiceRepository } from "../../../lib/memory-repository";
import type { Invoice } from "../../../lib/domain";

// Development account until authentication is installed.
const DEV_ACCOUNT_ID = "development-account";
const seed: Invoice[] = [
  { id: "1", customerName: "Northstar Studio", customerEmail: "billing@northstar.test", invoiceNumber: "INV-1042", amount: 1250, currency: "USD", dueDate: "2026-08-26", status: "overdue", createdAt: "2026-08-01" },
  { id: "2", customerName: "Maya Consulting", customerEmail: "maya@example.test", invoiceNumber: "INV-1043", amount: 780, currency: "USD", dueDate: "2026-08-30", status: "due_soon", createdAt: "2026-08-02" },
  { id: "3", customerName: "Atlas Repairs", customerEmail: "accounts@atlas.test", invoiceNumber: "INV-1041", amount: 420, currency: "USD", dueDate: "2026-08-18", status: "paid", createdAt: "2026-07-20" },
];
let seeded = false;

async function ensureSeeded() {
  if (seeded) return;
  for (const invoice of seed) await memoryInvoiceRepository.create(DEV_ACCOUNT_ID, invoice);
  seeded = true;
}

export async function GET() {
  await ensureSeeded();
  return NextResponse.json({ invoices: await memoryInvoiceRepository.list(DEV_ACCOUNT_ID) });
}

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const body = await request.json() as { customerName?: string; customerEmail?: string; amount?: number; dueDate?: string; currency?: string };
    if (!body.customerName?.trim() || !body.customerEmail?.trim() || !body.amount || body.amount <= 0 || !body.dueDate) {
      return NextResponse.json({ error: "customerName, customerEmail, positive amount and dueDate are required." }, { status: 400 });
    }
    const existing = await memoryInvoiceRepository.list(DEV_ACCOUNT_ID);
    const invoice = createInvoice({ customerName: body.customerName, customerEmail: body.customerEmail, amount: body.amount, dueDate: body.dueDate, currency: body.currency }, existing);
    await memoryInvoiceRepository.create(DEV_ACCOUNT_ID, invoice);
    return NextResponse.json({ invoice }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }
}
