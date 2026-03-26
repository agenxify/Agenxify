import express from "express";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Supabase setup for backend
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cxbfzsbytclbehnqcwsb.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YmZ6c2J5dGNsYmVobnFjd3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMjYwMzcsImV4cCI6MjA4NDgwMjAzN30.uxDo4bAGiJC5fU0pd9jK5nFIJlAT5aMZjKxdaT1EGyw';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/billing/usage", async (req, res) => {
    const userId = req.query.userId as string;
    console.log("Fetching usage for userId:", userId);
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      const { count: projects } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      const { count: seats } = await supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      const { count: pipelines } = await supabase.from('pipelines').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      const { count: bookings } = await supabase.from('event_types').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      const { count: services } = await supabase.from('services').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      const { count: onboarding } = await supabase.from('onboarding_flows').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      const { count: pages } = await supabase.from('pages').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      const { count: invoices } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      const { count: estimates } = await supabase.from('estimates').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      const { count: requests } = await supabase.from('requests').select('*', { count: 'exact', head: true }).eq('user_id', userId);

      // Fetch storage usage
      const { data: storageData } = await supabase.from('storage_files').select('size').eq('owner_id', userId);
      const storageKB = storageData?.reduce((acc, f) => acc + Number(f.size), 0) || 0;
      const storageUsedGB = storageKB / 1024 / 1024;

      // Fetch credits from workspace
      const { data: workspaceData } = await supabase.from('workspaces').select('credits_balance').eq('owner_id', userId).limit(1).single();
      const creditsBalance = workspaceData?.credits_balance || 0;

      res.json({
        projects: projects || 0,
        seats: seats || 0,
        pipelines: pipelines || 0,
        bookings: bookings || 0,
        services: services || 0,
        onboarding: onboarding || 0,
        pages: pages || 0,
        invoices: invoices || 0,
        estimates: estimates || 0,
        requests: requests || 0,
        storage: parseFloat(storageUsedGB.toFixed(2)),
        credits: creditsBalance
      });
    } catch (error) {
      console.error("Error fetching usage:", error);
      res.status(500).json({ error: "Failed to fetch usage" });
    }
  });

  app.get("/api/workspaces/count", async (req, res) => {
    const userId = req.query.userId as string;
    console.log("Fetching workspace count for userId:", userId);
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      const { count, error } = await supabase.from('workspaces').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      console.log("Workspace count result:", count);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching workspace count:", error);
      res.status(500).json({ error: "Failed to fetch workspace count" });
    }
  });

  app.get("/api/admin-profile", async (req, res) => {
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) return res.status(400).json({ error: "Missing workspaceId" });

    try {
      // 1. Get workspace owner_id
      const { data: workspace } = await supabase.from('workspaces').select('owner_id').eq('id', workspaceId).maybeSingle();
      if (!workspace) return res.status(404).json({ error: "Workspace not found" });

      // 2. Get owner profile from team_member
      const { data: profile } = await supabase.from('team_member').select('*').eq('workspace_id', workspaceId).eq('id', workspace.owner_id).maybeSingle();
      
      if (profile) {
        res.json(profile);
      } else {
        // Try to find by email if ID doesn't match (e.g. if owner_id was changed)
        const { data: memberData } = await supabase.from('workspace_members').select('email').eq('workspace_id', workspaceId).eq('role', 'owner').maybeSingle();
        if (memberData?.email) {
            const { data: profileByEmail } = await supabase.from('team_member').select('*').eq('workspace_id', workspaceId).ilike('email', memberData.email).maybeSingle();
            if (profileByEmail) return res.json(profileByEmail);
        }
        res.status(404).json({ error: "Admin profile not found" });
      }
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, name, fromName, subject, message, htmlContent, invoiceId, amount } = req.body;

      if (!to) {
        return res.status(400).json({ error: "Missing 'to' email address" });
      }

      const apiKey = process.env.BREVO_API_KEY;
      if (!apiKey) {
        console.error("BREVO_API_KEY is not set in environment variables.");
        return res.status(500).json({ error: "Email service is not configured." });
      }

      // Construct HTML content if not provided
      let finalHtmlContent = htmlContent;
      if (!finalHtmlContent) {
        finalHtmlContent = `
          <p>Hello ${name || to},</p>
          <p>${message || ""}</p>
          ${invoiceId ? `<p>Invoice ID: ${invoiceId}</p>` : ""}
          ${amount ? `<p>Amount: ${amount}</p>` : ""}
        `;
      }

      const response = await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
          sender: { email: "noreply@agenxify.com", name: fromName || "Agenxify" },
          to: [{ email: to, name: name || to }],
          subject: subject || "New Message from Agenxify",
          htmlContent: finalHtmlContent,
        },
        {
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
        }
      );

      res.status(200).json({ success: true, messageId: response.data.messageId });
    } catch (error: any) {
      console.error("Error sending email via Brevo:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

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
