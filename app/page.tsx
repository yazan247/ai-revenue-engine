"use client";

import { useMemo, useState } from "react";

type Status = "Overdue" | "Due soon" | "Paid";
type Invoice = { id: number; customer: string; email: string; number: string; amount: number; due: string; status: Status };

const initialInvoices: Invoice[] = [
  { id: 1, customer: "Northstar Studio", email: "billing@northstar.test", number: "INV-1042", amount: 1250, due: "2026-08-26", status: "Overdue" },
  { id: 2, customer: "Maya Consulting", email: "maya@example.test", number: "INV-1043", amount: 780, due: "2026-08-30", status: "Due soon" },
  { id: 3, customer: "Atlas Repairs", email: "accounts@atlas.test", number: "INV-1041", amount: 420, due: "2026-08-18", status: "Paid" },
];

function money(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value); }

export default function Home() {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [customer, setCustomer] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [reminder, setReminder] = useState("Choose an invoice to preview a professional follow-up message.");

  const totals = useMemo(() => ({
    outstanding: invoices.filter(i => i.status !== "Paid").reduce((a, i) => a + i.amount, 0),
    overdue: invoices.filter(i => i.status === "Overdue").reduce((a, i) => a + i.amount, 0),
    paid: invoices.filter(i => i.status === "Paid").reduce((a, i) => a + i.amount, 0),
  }), [invoices]);

  const visible = filter === "All" ? invoices : invoices.filter(i => i.status === filter);

  function addInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!customer.trim() || !email.trim() || !amount || !due || Number(amount) <= 0) return;
    const next = 1040 + invoices.length + 1;
    setInvoices([{ id: Date.now(), customer: customer.trim(), email: email.trim(), number: `INV-${next}`, amount: Number(amount), due, status: "Due soon" }, ...invoices]);
    setCustomer(""); setEmail(""); setAmount(""); setDue("");
  }

  function setStatus(id: number, status: Status) {
    setInvoices(invoices.map(i => i.id === id ? { ...i, status } : i));
  }

  function generate(i: Invoice) {
    const text = i.status === "Paid"
      ? `Subject: Payment confirmation — ${i.number}\n\nHi ${i.customer},\n\nThank you for your payment for invoice ${i.number} (${money(i.amount)}). We appreciate your business.`
      : i.status === "Overdue"
        ? `Subject: Friendly follow-up — ${i.number}\n\nHi ${i.customer},\n\nOur records show invoice ${i.number} for ${money(i.amount)} is now overdue. Please let us know if payment has already been arranged or if you need a copy of the invoice.\n\nThank you!`
        : `Subject: Upcoming invoice — ${i.number}\n\nHi ${i.customer},\n\nJust a friendly reminder that invoice ${i.number} for ${money(i.amount)} is due on ${i.due}. Please let us know if you have any questions.\n\nThank you!`;
    setReminder(text);
  }

  return <div className="shell">
    <header className="topbar"><div className="brand"><span className="logo">IP</span> InvoicePilot <span className="badge">MVP</span></div><span className="muted">Invoice follow-up, simplified.</span></header>
    <main className="main">
      <section className="hero"><div><h1>Good afternoon 👋</h1><p className="muted">Keep cash moving without chasing every invoice.</p></div><button className="primary" onClick={() => document.getElementById("new-invoice")?.scrollIntoView({ behavior: "smooth" })}>+ New invoice</button></section>
      <section className="grid">
        <div className="card"><div className="stat-label">Outstanding</div><div className="stat-value">{money(totals.outstanding)}</div></div>
        <div className="card"><div className="stat-label">Overdue</div><div className="stat-value">{money(totals.overdue)}</div></div>
        <div className="card"><div className="stat-label">Paid</div><div className="stat-value">{money(totals.paid)}</div></div>
        <div className="card"><div className="stat-label">Active invoices</div><div className="stat-value">{invoices.filter(i => i.status !== "Paid").length}</div></div>
      </section>
      <section className="layout">
        <div className="card"><div className="card-head"><span className="card-title">Invoices</span><select className="filter" value={filter} onChange={e => setFilter(e.target.value as "All" | Status)}><option>All</option><option>Overdue</option><option>Due soon</option><option>Paid</option></select></div>
          <div className="table-wrap"><table className="table"><thead><tr><th>Customer</th><th>Invoice</th><th>Amount</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map(i => <tr key={i.id}><td><strong>{i.customer}</strong><small>{i.email}</small></td><td>{i.number}</td><td>{money(i.amount)}</td><td>{i.due}</td><td><span className={`status ${i.status === "Overdue" ? "overdue" : i.status === "Paid" ? "paid" : "due"}`}>{i.status}</span></td><td><div className="actions"><button className="link-btn" onClick={() => generate(i)}>Remind</button><select className="mini-select" value={i.status} onChange={e => setStatus(i.id, e.target.value as Status)}><option>Overdue</option><option>Due soon</option><option>Paid</option></select></div></td></tr>)}</tbody></table></div>
        </div>
        <div className="card" id="new-invoice"><div className="card-head"><span className="card-title">Add invoice</span></div><form className="form" onSubmit={addInvoice}><label>Customer<input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Acme Studio" required /></label><label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="billing@acme.com" required /></label><label>Amount<input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1250" required /></label><label>Due date<input type="date" value={due} onChange={e => setDue(e.target.value)} required /></label><button className="primary" type="submit">Create invoice</button></form><div className="preview"><div className="card-title">Reminder preview</div><div className="reminder">{reminder}</div><p className="hint">MVP preview only — sending will be added after account and email integration.</p></div></div>
      </section>
    </main>
  </div>;
}
