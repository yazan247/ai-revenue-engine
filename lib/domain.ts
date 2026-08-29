export type InvoiceStatus = "overdue" | "due_soon" | "paid";

export type Invoice = {
  id: string;
  customerName: string;
  customerEmail: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: InvoiceStatus;
  createdAt: string;
};

export type ReminderStage = "upcoming" | "due_today" | "3_days_overdue" | "7_days_overdue" | "14_days_overdue";

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function reminderFor(invoice: Invoice, stage?: ReminderStage) {
  const selected = stage ?? (invoice.status === "overdue" ? "3_days_overdue" : "upcoming");
  const subject = selected === "upcoming" ? `Upcoming invoice — ${invoice.invoiceNumber}` : `Friendly follow-up — ${invoice.invoiceNumber}`;
  const opening = selected === "upcoming"
    ? `This is a friendly reminder that invoice ${invoice.invoiceNumber} for ${formatMoney(invoice.amount, invoice.currency)} is due on ${invoice.dueDate}.`
    : `Our records show invoice ${invoice.invoiceNumber} for ${formatMoney(invoice.amount, invoice.currency)} is still outstanding.`;
  return `Subject: ${subject}\n\nHi ${invoice.customerName},\n\n${opening}\n\nPlease let us know if payment has already been arranged or if you need a copy of the invoice.\n\nThank you!`;
}
