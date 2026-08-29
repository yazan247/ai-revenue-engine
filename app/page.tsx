"use client";

import { useMemo, useState } from "react";

type Invoice = { id: number; customer: string; email: string; number: string; amount: number; due: string; status: "Overdue" | "Due soon" | "Paid" };

const initialInvoices: Invoice[] = [
  { id: 1, customer: "Northstar Studio", email: "billing@northstar.test", number: "INV-1042", amount: 1250, due: "2026-08-26", status: "Overdue" },
  { id: 2, customer: "Maya Consulting", email: "maya@example.test", number: "INV-1043", amount: 780, due: "2026-08-30", status: "Due soon" },
  { id: 3, customer: "Atlas Repairs", email: "accounts@atlas.test", number: "INV-1041", amount: 420, due: "2026-08-18", status: "Paid" },
];

function money(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value); }

export default function Home() {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");
  const [reminder, setReminder] = useState("Select an overdue invoice to generate a professional reminder.");

  const totals = useMemo(() => ({
    outstanding: invoices.filter(i => i.status !== "Paid").reduce((a, i) => a + i.amount, 0),
    overdue: invoices.filter(i => i.status === "Overdue").reduce((a, i) => a + i.amount, 0),
    paid: invoices.filter(i => i.status === "Paid").reduce((a, i) => a + i.amount, 0),
  }), [invoices]);

  function addInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!customer || !amount || !due) return;
    const next = invoices.length + 1040;
    setInvoices([{ id: Date.now(), customer, email: "", number: `INV-${next}`, amount: Number(amount), due, status: "Due soon" }, ...invoices]);
    setCustomer(""); setAmount(""); setDue("");
  }

  function generate(i: Invoice) {
    const overdueLine = i.status === "Overdue" ? `Our records show invoice ${i.number} for ${money(i.amount)} is now overdue.` : `This is a friendly reminder that invoice ${i.number} for ${money(i.amount)} is due on ${i.due}.`;
    setReminder(`Subject: ${i.status === "Overdue" ? "Friendly follow-up on invoice " : "Upcoming invoice "}${i.number}\n\nHi ${i.customer},\n\n${overdueLine}\n\nPlease let us know if you have any questions or if payment has already been arranged. Thank you!`);
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
        <div className="card"><div className="card-head"><span className="card-title">Invoices</span><span className="muted">{invoices.length} total</span></div>
          <table className="table"><thead><tr><th>Customer</th><th>Invoice</th><th>Amount</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>{invoices.map(i => <tr key={i.id}><td><strong>{i.customer}</strong></td><td>{i.number}</td><td>{money(i.amount)}</td><td>{i.due}</td><td><span className={`status ${i.status === "Overdue" ? "overdue" : i.status === "Paid" ? "paid" : "due"}`}>{i.status}</span></td><td><button className="primary" style={{padding:"7px 9px",fontSize:11}} onClick={() => generate(i)}>Remind</button></td></tr>)}</tbody></table>
        </div>
        <div className="card" id="new-invoice"><div className="card-head"><span className="card-title">Add invoice</span></div><form className="form" onSubmit={addInvoice}><label>Customer<input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Acme Studio" /></label><label>Amount<input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1250" /></label><label>Due date<input type="date" value={due} onChange={e => setDue(e.target.value)} /></label><button className="primary" type="submit">Create invoice</button></form><div style={{marginTop:22}}><div className="card-title" style={{marginBottom:10}}>AI reminder preview</div><div className="reminder" style={{whiteSpace:"pre-wrap"}}>{reminder}</div></div></div>
      </section>
    </main>
  </div>;
}
