export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, name, message, subject, htmlContent, fromName, invoiceId, amount } = req.body;

  if (!to) {
    return res.status(400).json({ error: "Missing 'to' email address" });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("BREVO_API_KEY is not set in environment variables.");
    return res.status(500).json({ error: "Email service is not configured." });
  }

  let finalHtmlContent = htmlContent;
  if (!finalHtmlContent) {
    finalHtmlContent = `
      <p>Hello ${name || to},</p>
      <p>${message || ""}</p>
      ${invoiceId ? `<p>Invoice ID: ${invoiceId}</p>` : ""}
      ${amount ? `<p>Amount: ${amount}</p>` : ""}
    `;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { email: "noreply@agenxify.com", name: fromName || "Agencify" },
        to: [{ email: to, name: name || to }],
        subject: subject || "New Message from Agencify",
        htmlContent: finalHtmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error sending email via Brevo:", data);
      return res.status(response.status).json({ error: "Failed to send email", details: data });
    }

    return res.status(200).json({ success: true, messageId: data.messageId });
  } catch (error) {
    console.error("Error sending email via Brevo:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
