import { Resend } from "resend";

export async function sendLoginCode(email: string, code: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false as const, reason: "missing_key" as const };

  const resend = new Resend(key);
  const from = process.env.EMAIL_FROM || "SecondLook <beth.t@example.com>";
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Your SecondLook login code",
    text: `Your code is ${code}. It expires in 10 minutes.\n\nIf you did not request this, ignore the email.`,
  });
  if (error) {
    throw new Error(error.message || "Resend send failed");
  }
  return { sent: true as const };
}
