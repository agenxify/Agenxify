import crypto from "crypto";
import { supabase } from '../_supabase.js';

const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET;

const AVAILABLE_PLANS = {
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Signature Verification
  if (DODO_WEBHOOK_SECRET) {
    const signature = req.headers["x-dodo-signature"];
    const hmac = crypto.createHmac("sha256", DODO_WEBHOOK_SECRET);
    const bodyString = JSON.stringify(req.body);
    hmac.update(bodyString);
    const expectedSignature = hmac.digest("hex");
    
    if (signature !== expectedSignature) {
      console.warn("Webhook Signature Mismatch. Check DODO_WEBHOOK_SECRET.");
    }
  }

  const event = req.body;
  
  // Dodo event structure: data is the main object, and metadata is inside data
  const eventData = event.data || {};
  const metadata = eventData.metadata || {};
  
  const { userId, workspaceId, purchaseType, planId, billingCycle, addonId } = metadata;
  const productId = eventData.product_id;
  const amountPaid = eventData.total_amount || eventData.amount || 0;

  console.log("Processing Dodo Webhook:", {
    type: event.type,
    userId,
    workspaceId,
    purchaseType,
    productId,
    amount: amountPaid
  });

  if (!userId) {
    console.error("Webhook Error: No userId in metadata", eventData);
    return res.status(200).send("No userId found in metadata. Cannot process.");
  }

  try {
    // 1. Handle Subscriptions
    if (purchaseType === 'subscription' || (event.type && event.type.startsWith('subscription.'))) {
      // Logic for active subscriptions
      if (['subscription.active', 'subscription.created', 'subscription.renewed'].includes(event.type) || purchaseType === 'subscription') {
        const planKey = planId?.toLowerCase() || (productId ? productId.split('_')[1] : null) || "free";
        const planData = AVAILABLE_PLANS[planKey] || AVAILABLE_PLANS['starter'];

        console.log(`Updating subscription for user ${userId} to plan ${planKey}`);

        const { error: subError } = await supabase
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

        if (subError) throw subError;

        if (workspaceId) {
          await supabase.from('workspaces').update({ plan_id: planKey }).eq('id', workspaceId);
        }
      }
    } 
    // 2. Handle Credits
    else if (purchaseType === 'credits' || (event.type === "payment.succeeded" && productId?.startsWith('pdt_0Ncpl'))) {
         let creditAmount = 0;
         // Match based on project IDs from dodo.ts
         if (productId === 'pdt_0NcplIaIzEFtvIBsrPuSm') creditAmount = 500;   // Starter Boost
         else if (productId === 'pdt_0NcplPOW4ftUAFciHSZ7G') creditAmount = 1500; // Growth Pack
         else if (productId === 'pdt_0NcplZqPBlqEFWxFPjlyf') creditAmount = 5000; // Power User
         else if (productId === 'pdt_0NckvHhyg5xsRY3Bsz67A') creditAmount = 20000; // Agency Scale
         
         // Fallback if productId doesn't match predefined but it's a credit purchase
         if (creditAmount === 0 && purchaseType === 'credits') {
            // Estimate based on amount if possible, or just default
            creditAmount = 1000; 
         }

         console.log(`Adding ${creditAmount} credits to user ${userId}`);

         const { error: creditError } = await supabase
           .from("topup_credits")
           .insert({
             owner_id: userId,
             workspace_id: workspaceId,
             amount: creditAmount,
             cost: amountPaid / 100,
             status: 'active',
             metadata: { 
               dodo_payment_id: eventData.payment_id || eventData.transaction_id, 
               productId,
               raw_event: event.type
             }
           });
           
         if (creditError) throw creditError;
    }
    // 3. Handle Addons
    else if (purchaseType === 'addon' || event.type === "payment.succeeded") {
        console.log(`Adding addon ${addonId || productId} to user ${userId}`);
        const { error: addonError } = await supabase
          .from("purchased_addons")
          .insert({
            owner_id: userId,
            workspace_id: workspaceId || null,
            addon_id: addonId || productId,
          });
        
        if (addonError) throw addonError;
    }

    // 4. Billing History
    let finalWorkspaceId = workspaceId;
    if (!finalWorkspaceId) {
       const { data: wsData } = await supabase.from('workspaces').select('id').eq('owner_id', userId).limit(1).single();
       if (wsData) finalWorkspaceId = wsData.id;
    }

    if (finalWorkspaceId) {
      await supabase.from("billing_history").insert({
        owner_id: userId,
        workspace_id: finalWorkspaceId,
        invoice_number: eventData.payment_id || eventData.subscription_id || `INV-${Date.now()}`,
        amount: amountPaid / 100,
        status: 'Paid',
        line_items: [{ name: eventData.product_name || 'Agencify Purchase', amount: amountPaid / 100 }],
        date_paid: new Date().toISOString(),
      });
    }

    return res.status(200).send("Webhook Processed Successfully");
  } catch (err) {
    console.error("Webhook Execution Error:", err);
    // Still return 200 to Dodo to prevent re-deliveries if we had a non-critical logic error, 
    // but in a real case we might want to return 500.
    return res.status(500).json({ error: err.message });
  }
}
