export type CheckoutPlan = "pro" | "business";

export type CheckoutResult = {
  provider: "iyzico-link";
  checkoutUrl: string;
};

/** External-link adapter. No secrets or provider credentials are stored in source. */
export async function createPaymentCheckout(plan: CheckoutPlan): Promise<CheckoutResult> {
  const envName = plan === "pro" ? "IYZICO_PRO_PAYMENT_URL" : "IYZICO_BUSINESS_PAYMENT_URL";
  const checkoutUrl = process.env[envName];
  if (!checkoutUrl) throw new Error(`${envName} is not configured`);
  return { provider: "iyzico-link", checkoutUrl };
}
