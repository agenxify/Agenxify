import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase Admin Client (Service Role Key)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Webhook handler needs raw body for signature verification
  app.post('/api/webhooks/dodo', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['x-dodo-signature'] as string;
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return res.status(400).send('Webhook Error');
    }

    // Verify Signature
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = hmac.update(req.body).digest('hex');

    if (signature !== digest) {
      console.error('Invalid signature');
      return res.status(401).send('Invalid Signature');
    }

    const event = JSON.parse(req.body.toString());
    console.log('Received Dodo Webhook:', event.type);

    try {
      const { type, data } = event;
      const metadata = data.metadata || {};
      const workspaceId = data.client_reference_id || metadata.workspace_id;
      const userId = metadata.user_id || data.customer_id;

      if (!workspaceId) {
        console.warn('No workspace_id found in event metadata');
        return res.status(200).send('Ignored: No Workspace ID');
      }

      switch (type) {
        case 'subscription.created':
        case 'subscription.active': {
          // Update Subscription and Workspace
          // Prioritize metadata passed from frontend checkout redirect
          const planId = metadata.planId || data.product_id; 
          const cycle = metadata.cycle || data.billing_cycle || 'monthly';
          const status = data.status; 

          // 1. Update Subscriptions Table
          await supabaseAdmin.from('subscriptions').upsert({
            workspace_id: workspaceId,
            owner_id: userId,
            plan_id: planId,
            billing_cycle: cycle,
            status: status,
            updated_at: new Date().toISOString()
          }, { onConflict: 'workspace_id' });

          // 2. Update Workspace Table
          await supabaseAdmin.from('workspaces').update({
            plan_id: planId,
            billing_cycle: cycle,
            has_used_trial: true // Mark trial as used
          }).eq('id', workspaceId);

          break;
        }

        case 'subscription.expired':
        case 'subscription.cancelled': {
          // Revert to Free Plan
          await supabaseAdmin.from('subscriptions').update({
            plan_id: 'free',
            status: 'expired'
          }).eq('workspace_id', workspaceId);

          await supabaseAdmin.from('workspaces').update({
            plan_id: 'free'
          }).eq('id', workspaceId);

          break;
        }

        case 'payment.succeeded': {
          // Handle one-time purchases like Addons or Credits
          if (metadata.type === 'addon_purchase') {
            await supabaseAdmin.from('purchased_addons').insert({
              workspace_id: workspaceId,
              owner_id: userId,
              addon_id: metadata.addonId,
              status: 'active',
              billing_cycle: metadata.cycle || 'annual'
            });
          } else if (metadata.type === 'credit_topup') {
            // Increment credits via topup_credits table
            await supabaseAdmin.from('topup_credits').insert({
              workspace_id: workspaceId,
              owner_id: userId,
              amount: Number(metadata.creditsValue),
              cost: Number(data.total_amount) / 100, 
              status: 'active'
            });
          }
          break;
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // Standard API routes
  app.use(express.json());
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
