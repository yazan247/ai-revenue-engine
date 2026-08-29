export type ReminderEmail = { to: string; subject: string; text: string };

/**
 * Sends through a configured HTTP email provider without storing provider credentials in code.
 * Required env: EMAIL_PROVIDER_URL, EMAIL_PROVIDER_API_KEY, EMAIL_FROM.
 */
export async function sendReminderEmail(email: ReminderEmail) {
  const url = process.env.EMAIL_PROVIDER_URL;
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!url || !apiKey || !from) throw new Error("Email provider is not configured.");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ from, to: email.to, subject: email.subject, text: email.text }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}.`);
}
