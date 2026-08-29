export type ReminderEmail = { to: string; subject: string; text: string };

/** Sends through Resend. Credentials stay in the deployment environment. */
export async function sendReminderEmail(email: ReminderEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Resend email is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to: [email.to], subject: email.subject, text: email.text }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Resend rejected email", detail);
    throw new Error(`Resend returned ${response.status}.`);
  }
}
