import { DodoPayments } from "dodopayments";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { productId, userId, email, workspaceId, metadata } = req.body;
  const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY;

  if (!DODO_API_KEY) {
    return res.status(500).json({ error: "Server Configuration Error: DODO_PAYMENTS_API_KEY is missing in Vercel. Please add it to your environment variables." });
  }

  if (!productId || !userId || !email) {
    return res.status(400).json({ error: "Missing required fields (productId, userId, email)" });
  }

  try {
    const dodoPayments = new DodoPayments({
      bearerToken: DODO_API_KEY,
    });

    const session = await dodoPayments.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email: email },
      metadata: {
        userId,
        workspaceId: workspaceId || "",
        ...(metadata || {}),
      },
      payment_links: true,
      return_url: `${process.env.VITE_APP_URL || "https://app.agenxify.com"}/billing/plans`,
    });

    return res.status(200).json({ url: session.payment_link });
  } catch (err) {
    console.error("Dodo Checkout Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
