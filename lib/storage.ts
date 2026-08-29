import type { Invoice } from "./domain";

const KEY = "invoicepilot.invoices.v1";

export function loadInvoices(fallback: Invoice[]): Invoice[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Invoice[]) : fallback;
  } catch {
    return fallback;
  }
}

export function saveInvoices(invoices: Invoice[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(invoices));
}

export function clearStoredInvoices() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
