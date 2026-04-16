
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";

import { DodoPayments } from "dodopayments";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Supabase Private Client (Service Role)
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Dodo Config
const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY;
const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET;

const dodoPayments = new DodoPayments({
  bearerToken: DODO_API_KEY || "",
});

// Plan definitions for synchronization
const AVAILABLE_PLANS: Record<string, any> = {
  free: {
    name: 'Free',
    seatLimit: 0,
    storageLimitGB: 0.5,
    baseCredits: 100,
    projectLimit: 2,
    clientLimit: 1,
    pipelineLimit: 1,
    bookingsLimit: 1,
    servicesLimit: 0,
    onboardingLimit: 1,
    pagesLimit: 1,
    invoicesLimit: 10,
    estimatesLimit: 10,
    ticketsLimit: 30,
    marketingEmailsLimit: 0,
    workspacesLimit: 1,
    features: ['2 Requests', '30 Tickets', '100 Zify AI Credits', '1 Pipeline Domain', '1 Booking Form', '1 Client', '1 Onboarding Form', '10 Invoices', '10 Estimates', '1 Page', '500 MB Storage', '1 Workspace']
  },
  starter: {
    name: 'Starter',
    seatLimit: 2,
    storageLimitGB: 10,
    baseCredits: 1000,
    projectLimit: 15,
    clientLimit: 10,
    pipelineLimit: -1,
    bookingsLimit: 20,
    servicesLimit: 20,
    onboardingLimit: -1,
    pagesLimit: 30,
    invoicesLimit: -1,
    estimatesLimit: -1,
    ticketsLimit: 150,
    marketingEmailsLimit: 20,
    workspacesLimit: 3,
    features: ['15 Requests', '150 Tickets', '1,000 Zify AI Credits', 'Unlimited Pipelines', '20 Booking Forms', '10 Clients', '2 Team Members', '20 Services', 'Unlimited Onboarding Forms', 'Unlimited Invoices & Estimates', '20 Marketing Emails', '30 Pages', '10 GB Storage', '3 Workspaces']
  },
  growth: {
    name: 'Growth',
    seatLimit: 5,
    storageLimitGB: 35,
    baseCredits: 3000,
    projectLimit: 50,
    clientLimit: 35,
    pipelineLimit: -1,
    bookingsLimit: 80,
    servicesLimit: 70,
    onboardingLimit: -1,
    pagesLimit: 70,
    invoicesLimit: -1,
    estimatesLimit: -1,
    ticketsLimit: 150,
    marketingEmailsLimit: 50,
    workspacesLimit: 5,
    features: ['50 Requests', '150 Tickets', '3,000 Zify AI Credits', 'Unlimited Pipelines', '80 Booking Forms', '35 Clients', '5 Team Members', '70 Services', 'Unlimited Onboarding Forms', 'Unlimited Invoices & Estimates', '50 Marketing Emails', '70 Pages', '35 GB Storage', '5 Workspaces']
  },
  enterprise: {
    name: 'Enterprise',
    seatLimit: 20,
    storageLimitGB: 250,
    baseCredits: 30000,
    projectLimit: 300,
    clientLimit: 100,
    pipelineLimit: -1,
    bookingsLimit: -1,
    servicesLimit: 200,
    onboardingLimit: -1,
    pagesLimit: 150,
    invoicesLimit: -1,
    estimatesLimit: -1,
    ticketsLimit: 1000,
    marketingEmailsLimit: 150,
    workspacesLimit: 15,
    features: ['300 Requests', '1,000 Tickets', '30,000 Zify AI Credits', 'Unlimited Pipelines', 'Unlimited Booking Forms', '100 Clients', '20 Team Members', '200 Services', 'Unlimited Onboarding Forms', 'Unlimited Invoices & Estimates', '150 Marketing Emails', '150 Pages', '250 GB Storage', '15 Workspaces']
  }
};

app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

// API: Create Checkout Session
app.post("/api/billing/create-checkout-session", async (req, res) => {
  try {
    const { productId, userId, email, workspaceId, metadata } = req.body;

    if (!DODO_API_KEY) {
      return res.status(500).json({ error: "Dodo API key not configured" });
    }

    const checkout = await dodoPayments.checkoutSessions.create({
      product_cart: [{
        product_id: productId,
        quantity: 1,
      }],
      customer: {
        email: email,
      },
      billing_address: {
        country: "US", // Default or gathered from frontend
      },
      metadata: {
        ...(metadata || {}),
        userId: userId,
        workspaceId: workspaceId,
      },
      return_url: `${process.env.VITE_APP_URL || 'https://app.agenxify.com'}/billing/status?success=true`,
    });

    res.json({ url: checkout.checkout_url });
  } catch (error: any) {
    console.error("Dodo Checkout Error:", error.message);
    res.status(500).json({ error: "Failed to create checkout session. Connectivity issue." });
  }
});

// API: Webhook Handler
app.post("/api/webhooks/dodo", async (req: any, res) => {
  const signature = req.headers["x-dodo-signature"];
  
  // Signature Verification
  if (DODO_WEBHOOK_SECRET) {
    const hmac = crypto.createHmac("sha256", DODO_WEBHOOK_SECRET);
    hmac.update(req.rawBody);
    const expectedSignature = hmac.digest("hex");
    
    if (signature !== expectedSignature) {
      console.error("Invalid Webhook Signature. Expected:", expectedSignature, "Got:", signature);
      return res.status(401).send("Invalid Signature");
    }
  }

  const event = req.body;
  console.log("Dodo Webhook Received:", event.type);
  console.log("Event Data Metadata:", JSON.stringify(event.data?.metadata || {}, null, 2));

  try {
    const metadata = event.data?.metadata || {};
    const { userId, workspaceId, purchaseType, planId, billingCycle, addonId } = metadata;
    const productId = event.data?.product_id;
    const amountPaid = event.data?.total_amount || event.data?.amount || 0; // handle different Dodo payload versions

    if (!userId) {
      console.error("No userId found in webhook metadata. Full data:", JSON.stringify(event.data, null, 2));
      return res.status(200).send("No user ID found in metadata");
    }

    // --- 1. Handle Subscriptions (Plans) ---
    if (purchaseType === 'subscription' || event.type.startsWith('subscription.')) {
      if (['subscription.active', 'subscription.created', 'subscription.renewed'].includes(event.type) || purchaseType === 'subscription') {
        const planKey = planId?.toLowerCase() || productId || "free";
        const planData = AVAILABLE_PLANS[planKey] || AVAILABLE_PLANS['starter']; // fallback to starter if unknown but subscription event
        
        console.log(`Processing subscription for user ${userId}, Plan: ${planKey}`);

        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({
            plan_id: planKey,
            plan_name: planData.name,
            billing_cycle: billingCycle || 'monthly',
            seat_limit: planData.seatLimit,
            storage_limit_gb: planData.storageLimitGB,
            base_credits: planData.baseCredits,
            project_limit: planData.projectLimit,
            client_limit: planData.clientLimit,
            pipeline_limit: planData.pipelineLimit,
            bookings_limit: planData.bookingsLimit,
            services_limit: planData.servicesLimit,
            onboarding_limit: planData.onboardingLimit,
            pages_limit: planData.pagesLimit,
            invoices_limit: planData.invoicesLimit,
            estimates_limit: planData.estimatesLimit,
            tickets_limit: planData.ticketsLimit,
            marketing_emails_limit: planData.marketingEmailsLimit,
            workspaces_limit: planData.workspacesLimit,
            features: planData.features,
            updated_at: new Date().toISOString(),
          })
          .eq("owner_id", userId);

        if (error) {
          console.error("Error updating subscription table:", error);
          throw error;
        }

        // Also update the Workspace plan_id if available
        if (workspaceId) {
            await supabaseAdmin.from('workspaces').update({ plan_id: planKey }).eq('id', workspaceId);
        }

        console.log(`Successfully updated all limits for user ${userId} and plan ${planKey}`);
      }
    } 
    // --- 2. Handle AI Credits (One-time) ---
    else if (purchaseType === 'credits' || (event.type === "payment.succeeded" && productId?.startsWith('pdt_0Ncpl'))) {
         let creditAmount = 0;
         // Matching IDs from dodo.ts
         if (productId === 'pdt_0NcplIaIzEFtvIBsrPuSm') creditAmount = 5000;
         else if (productId === 'pdt_0NcplPOW4ftUAFciHSZ7G') creditAmount = 20000;
         else if (productId === 'pdt_0NcplZqPBlqEFWxFPjlyf') creditAmount = 50000;
         else if (productId === 'pdt_0NckvHhyg5xsRY3Bsz67A') creditAmount = 150000;

         console.log(`Processing credits for user ${userId}, Amount: ${creditAmount}`);

         const { error } = await supabaseAdmin
           .from("topup_credits")
           .insert({
             owner_id: userId,
             workspace_id: workspaceId,
             amount: creditAmount,
             cost: amountPaid / 100,
             status: 'active',
             metadata: { dodo_payment_id: event.data?.payment_id || event.data?.transaction_id, productId }
           });

         if (error) {
           console.error("Error inserting into topup_credits:", error);
           throw error;
         }
         console.log(`Successfully added ${creditAmount} credits for user ${userId}`);
    }
    // --- 3. Handle Addons (One-time or Subscription Addons) ---
    else if (purchaseType === 'addon' || event.type === "payment.succeeded") {
        console.log(`Processing addon for user ${userId}, Addon: ${addonId || productId}`);

        const { error } = await supabaseAdmin
          .from("purchased_addons")
          .insert({
            owner_id: userId,
            workspace_id: workspaceId,
            addon_id: addonId || productId,
          });
          
        if (error) {
          console.error("Error inserting into purchased_addons:", error);
          throw error;
        }
        console.log(`Successfully added addon ${addonId || productId} for user ${userId}`);
    }
      
    // --- 4. Billing History Update (Always record) ---
    // Ensure we have a workspaceId for the required FK in billing_history
    let finalWorkspaceId = workspaceId;
    if (!finalWorkspaceId) {
       const { data: wsData } = await supabaseAdmin.from('workspaces').select('id').eq('owner_id', userId).limit(1).single();
       if (wsData) finalWorkspaceId = wsData.id;
    }

    const { error: billingError } = await supabaseAdmin.from("billing_history").insert({
      owner_id: userId,
      workspace_id: finalWorkspaceId,
      invoice_number: event.data?.payment_id || event.data?.subscription_id || `INV-${Date.now()}`,
      amount: amountPaid / 100,
      status: 'Paid',
      line_items: [{ name: event.data?.product_name || 'Agencify Purchase', amount: amountPaid / 100 }],
      date_paid: new Date().toISOString(),
    });

    if (billingError) {
      console.warn("Billing history insertion failed (non-critical):", billingError.message);
    }

    res.status(200).send("Webhook Processed Successfully");
  } catch (err: any) {
    console.error("Webhook Processing Fatal Error:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
