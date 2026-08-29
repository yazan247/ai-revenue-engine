import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import { reminderFor, type Invoice, type ReminderStage } from "../../../../lib/domain";
import { sendReminderEmail } from "../../../../lib/email";

export const dynamic = "force-dynamic";

const stages: Array<{ stage: ReminderStage; offset: number }> = [
  { stage: "upcoming", offset: -3 },
  { stage: "due_today", offset: 0 },
  { stage: "3_days_overdue", offset: 3 },
  { stage: "7_days_overdue", offset: 7 },
  { stage: "14_days_overdue", offset: 14 },
];

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function runReminders() {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const results: Array<{ invoiceId: string; stage: string; status: string }> = [];

  for (const candidate of stages) {
    const { rows } = await db.query<Invoice & { accountId: string }>(
      `select id::text, account_id::text as "accountId", customer_name as "customerName", customer_email as "customerEmail", invoice_number as "invoiceNumber", amount::float8 as amount, currency, due_date::text as "dueDate", status, created_at::text as "createdAt"
       from invoices where status <> 'paid' and due_date = (current_date + $1::int)`,
      [candidate.offset],
    );

    for (const invoice of rows) {
      const claim = await db.query(
        `insert into reminder_deliveries (id, invoice_id, stage, scheduled_for, status)
         values ($1,$2,$3,$4,'pending')
         on conflict (invoice_id, stage, scheduled_for) do nothing`,
        [randomUUID(), invoice.id, candidate.stage, today],
      );
      if (claim.rowCount !== 1) continue;

      try {
        const message = reminderFor(invoice, candidate.stage);
        const subject = message.split("\n")[0].replace(/^Subject:\s*/, "");
        await sendReminderEmail({ to: invoice.customerEmail, subject, text: message });
        await db.query(`update reminder_deliveries set status='sent', sent_at=now() where invoice_id=$1 and stage=$2 and scheduled_for=$3`, [invoice.id, candidate.stage, today]);
        results.push({ invoiceId: invoice.id, stage: candidate.stage, status: "sent" });
      } catch (error) {
        const detail = error instanceof Error ? error.message.slice(0, 500) : "Unknown email error";
        await db.query(`update reminder_deliveries set status='failed', error=$1 where invoice_id=$2 and stage=$3 and scheduled_for=$4`, [detail, invoice.id, candidate.stage, today]);
        results.push({ invoiceId: invoice.id, stage: candidate.stage, status: "failed" });
      }
    }
  }
  return { ok: true, date: today, processed: results.length, results };
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json(await runReminders());
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json(await runReminders());
}
