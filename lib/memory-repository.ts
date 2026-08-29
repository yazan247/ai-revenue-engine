import type { Invoice, InvoiceStatus } from "./domain";
import type { InvoiceRepository } from "./repository";

/** Single shared development repository. Replace this adapter with PostgreSQL in production. */
const store = new Map<string, Invoice[]>();

export const memoryInvoiceRepository: InvoiceRepository = {
  async list(accountId) { return [...(store.get(accountId) ?? [])]; },
  async create(accountId, invoice) {
    const current = store.get(accountId) ?? [];
    current.unshift(invoice);
    store.set(accountId, current);
    return invoice;
  },
  async updateStatus(accountId, invoiceId, status: InvoiceStatus) {
    const current = store.get(accountId) ?? [];
    const index = current.findIndex(i => i.id === invoiceId);
    if (index < 0) return null;
    current[index] = { ...current[index], status };
    return current[index];
  },
  async remove(accountId, invoiceId) {
    const current = store.get(accountId) ?? [];
    const next = current.filter(i => i.id !== invoiceId);
    if (next.length === current.length) return false;
    store.set(accountId, next);
    return true;
  },
};
