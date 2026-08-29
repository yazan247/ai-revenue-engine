import type { Invoice } from "./domain";

/** Provider-neutral persistence contract. Production adapters must scope every operation by accountId. */
export interface InvoiceRepository {
  list(accountId: string): Promise<Invoice[]>;
  getById(accountId: string, invoiceId: string): Promise<Invoice | null>;
  create(accountId: string, invoice: Invoice): Promise<Invoice>;
  updateStatus(accountId: string, invoiceId: string, status: Invoice["status"]): Promise<Invoice | null>;
  remove(accountId: string, invoiceId: string): Promise<boolean>;
}
