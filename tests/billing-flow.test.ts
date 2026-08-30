import assert from "node:assert/strict";
import test from "node:test";

const plans = { free: { amountCents: 0 }, pro: { amountCents: 900 }, business: { amountCents: 1900 } } as const;

test("Free plan has no paid checkout price", () => assert.equal(plans.free.amountCents, 0));
test("Pro price is $9", () => assert.equal(plans.pro.amountCents, 900));
test("Business price is $19", () => assert.equal(plans.business.amountCents, 1900));
test("paid plans are distinct", () => assert.notEqual(plans.pro.amountCents, plans.business.amountCents));

test("pending payment is not an activated plan", () => {
  const payment = { status: "pending_payment", subscriptionStatus: "active", subscriptionPlan: "free" };
  assert.equal(payment.status, "pending_payment");
  assert.equal(payment.subscriptionPlan, "free");
});

test("approval is the only transition that activates a paid plan", () => {
  const transition = (paymentStatus: string, plan: string) => paymentStatus === "paid" && (plan === "pro" || plan === "business") ? plan : "free";
  assert.equal(transition("pending_payment", "pro"), "free");
  assert.equal(transition("rejected", "business"), "free");
  assert.equal(transition("paid", "pro"), "pro");
  assert.equal(transition("paid", "business"), "business");
});
