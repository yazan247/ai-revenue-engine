import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import { reminderFor, type Invoice, type ReminderStage } from "../../../../lib/domain";
import { sendReminderEmail } from "../../../../lib/email";
import { assertAutomaticReminders } from "../../../../lib/subscription-service";

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
      `select i.id::text, i.account_id::text as "accountId", i.customer_name as "customerName", i.customer_email as "customerEmail", i.invoice_number as "invoiceNumber", i.amount::float8 as amount, i.currency, i.due_date::text as "dueDate", i.status, i.created_at::text as "createdAt"
       from invoices i
       join subscriptions s on s.account_id = i.account_id and s.status in ('active','trialing')
       join plan_catalog p on p.plan = s.plan and coalesce((p.features->>'automatic_reminders')::boolean, false)
       where i.status <> 'paid' and i.due_date = (current_date + $1::int)`,
      [candidate.offset],
    );

    for (const invoice of rows) {
      try {
        await assertAutomaticReminders(invoice.accountId);
        const claim = await db.query(
          `insert into reminder_deliveries (id, invoice_id, stage, scheduled_for, status)
           values ($1,$2,$3,$4,'pending')
           on conflict (invoice_id, stage, scheduled_for) do nothing`,
          [randomUUID(), invoice.id, candidate.stage, today],
        );
        if (claim.rowCount !== 1) continue;

        const message = reminderFor(invoice, candidate.stage);
        const subject = message.split("\n")[0].replace(/^Subject:\s*/, "");
        await sendReminderEmail({ to: invoice.customerEmail, subject, text: message });
        await db.query(`update reminder_deliveries set status='sent', sent_at=now() where invoice_id=$1 and stage=$2 and scheduled_for=$3`, [invoice.id, candidate.stage, today]);
        results.push({ invoiceId: invoice.id, stage: candidate.stage, status: "sent" });
      } catch (error) {
        const detail = error instanceof Error ? error.message.slice(0, 500) : "Unknown reminder error";
        const code = (error as { code?: string })?.code;
        if (code === "PLAN_REQUIRED") { results.push({ invoiceId: invoice.id, stage: candidate.stage, status: "skipped_plan" }); continue; }
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
