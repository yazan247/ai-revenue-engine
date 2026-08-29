import type { Invoice } from "./domain";

/** Provider-neutral persistence contract. Production adapters must scope every operation by accountId. */
export interface InvoiceRepository {
  list(accountId: string): Promise<Invoice[]>;
  create(accountId: string, invoice: Invoice): Promise<Invoice>;
  updateStatus(accountId: string, invoiceId: string, status: Invoice["status"]): Promise<Invoice | null>;
  remove(accountId: string, invoiceId: string): Promise<boolean>;
}
