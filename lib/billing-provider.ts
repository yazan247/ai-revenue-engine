export type PaidPlan = "pro" | "business";

export type CheckoutRequest = {
  accountId: string;
  plan: PaidPlan;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutResult = { checkoutUrl: string; providerReference: string };

/** Provider-neutral billing contract. A production provider must return a verified checkout URL.
 * Never activate a subscription from the browser redirect; only a verified provider webhook may do so.
 */
export interface BillingProvider {
  createCheckout(request: CheckoutRequest): Promise<CheckoutResult>;
}

export function getBillingProvider(): BillingProvider {
  throw new Error("No production billing provider is configured yet. Configure an approved provider before enabling paid checkout.");
}
