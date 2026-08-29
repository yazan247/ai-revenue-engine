import type { Invoice, InvoiceStatus } from "./domain";
import type { InvoiceRepository } from "./repository";
import { getDb } from "./db";

const invoiceColumns = `id::text, customer_name as "customerName", customer_email as "customerEmail", invoice_number as "invoiceNumber", amount::float8 as amount, currency, due_date::text as "dueDate", status, created_at::text as "createdAt"`;

export const postgresInvoiceRepository: InvoiceRepository = {
  async list(accountId) {
    const { rows } = await getDb().query<Invoice>(`select ${invoiceColumns} from invoices where account_id = $1 order by created_at desc`, [accountId]);
    return rows;
  },
  async getById(accountId, invoiceId) {
    const { rows } = await getDb().query<Invoice>(`select ${invoiceColumns} from invoices where id = $1 and account_id = $2 limit 1`, [invoiceId, accountId]);
    return rows[0] ?? null;
  },
  async create(accountId, invoice) {
    await getDb().query(`insert into invoices (id, account_id, customer_name, customer_email, invoice_number, amount, currency, due_date, status, created_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [invoice.id, accountId, invoice.customerName, invoice.customerEmail, invoice.invoiceNumber, invoice.amount, invoice.currency, invoice.dueDate, invoice.status, invoice.createdAt]);
    return invoice;
  },
  async updateStatus(accountId, invoiceId, status: InvoiceStatus) {
    const { rows } = await getDb().query<Invoice>(`update invoices set status = $1 where id = $2 and account_id = $3 returning ${invoiceColumns}`, [status, invoiceId, accountId]);
    return rows[0] ?? null;
  },
  async remove(accountId, invoiceId) {
    const result = await getDb().query(`delete from invoices where id = $1 and account_id = $2`, [invoiceId, accountId]);
    return result.rowCount === 1;
  },
};
