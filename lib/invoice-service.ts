import type { Invoice, InvoiceStatus } from "./domain";

export function createInvoice(input: { customerName: string; customerEmail: string; amount: number; dueDate: string; currency?: string }, existing: Invoice[]): Invoice {
  const highest = existing.reduce((max, item) => Math.max(max, Number(item.invoiceNumber.replace(/\D/g, "")) || 0), 1040);
  return {
    id: crypto.randomUUID(),
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail.trim().toLowerCase(),
    invoiceNumber: `INV-${highest + 1}`,
    amount: input.amount,
    currency: input.currency ?? "USD",
    dueDate: input.dueDate,
    status: "due_soon",
    createdAt: new Date().toISOString(),
  };
}

export function updateInvoiceStatus(invoices: Invoice[], id: string, status: InvoiceStatus) {
  return invoices.map((invoice) => invoice.id === id ? { ...invoice, status } : invoice);
}

export function deleteInvoice(invoices: Invoice[], id: string) {
  return invoices.filter((invoice) => invoice.id !== id);
}
