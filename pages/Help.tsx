
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, MessageCircle, FileText, Book, ArrowRight, 
  CheckCircle2, ChevronDown, ChevronRight, 
  Send, Zap, Globe, Mail,
  LifeBuoy, Bot, X, Paperclip, MoreHorizontal,
  PlayCircle, Clock, Shield, AlertCircle, Phone, 
  LayoutGrid, List, Video, User, Star, Sparkles,
  Bold, Italic, Code, Link as LinkIcon, Eraser, AlignLeft,
  Trash2, Download, Plus, Upload, Film, MonitorPlay, Eye,
  Printer, Share2, Bookmark, Youtube, ExternalLink, Play, Users
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- SYSTEM CONTEXT & NAVIGATION MAP ---

const UI_NAVIGATION_MAP = `
UI VISUAL MAP (Where things are located):
1. SIDEBAR (Left):
   - Top: Agency Logo & Name.
   - Hub Section: Dashboard, Activity Log, Requests, Tickets, Zify AI.
   - Operations Section: Pipeline, Automation, Calendar, Bookings, Users (Clients/Team), Services, Onboarding, Timesheets, Tasks.
   - Enterprise Section: Messages (Inbox), Invoices, Estimates, Marketing, Pages, Reports, Storage.
   - System Section (Bottom): Settings, Support (Help).
   - Bottom Card: Subscription/Plan Details.

2. HEADER (Top Bar):
   - Left: Breadcrumbs (Current Page Name).
   - Right: Global Actions (Schedule, Notifications Bell, Profile Avatar).

3. SPECIFIC PAGE LAYOUTS:
   - Dashboard: KPI cards top, Charts middle, Recent lists bottom.
   - Requests: "New Request" button is Top-Right. Filters are Top-Left.
   - Billing: "New Invoice" button is Top-Right. "Export" is in the filter bar.
   - Settings: Tab navigation is vertical on the left (Identity, Optics, Neural, etc.). Toggle switches are on the right.
   - Marketing: "New Campaign" is Top-Right. Tabs (Editor, Analytics) are Top-Center.
   
4. MODALS:
   - Always centered with a blurred backdrop.
   - Close button (X) is always Top-Right of the modal.
   - Primary Action buttons (Save, Create, Send) are Bottom-Right.
`;

// Helper to gather all local data for the AI
const getLiveSystemState = () => {
  const get = (key: string) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : 'No Data';
    } catch (e) { return 'Error reading data'; }
  };

  return JSON.stringify({
    timestamp: new Date().toISOString(),
    currentUser: get('agencyos_profile_data'),
    globalConfig: get('agencyos_global_config'),
    clients: get('agencyos_clients'),
    projects: get('agencyos_projects'),
    invoices: get('agencyos_invoices'),
    estimates: get('agencyos_estimates'),
    tickets: get('agencyos_tickets'),
    requests: get('agencyos_requests'),
    team: get('agencyos_team_members'),
    services: get('agencyos_services'),
    marketingCampaigns: get('agencyos_marketing_campaigns'),
    automationFlows: get('agencyos_automation_flows'),
    recentActivity: get('agencyos_activity_logs')
  }, null, 2);
};

// --- MANUAL KNOWLEDGE BASE (Articles 1-156) ---
const DETAILED_ARTICLES: Record<string, string> = {
  '1': `# Zify AI Quick Start Guide

Welcome to **Zify AI**. This platform is designed to be the central nervous system of your digital agency. This guide will take you from zero to fully operational in approximately 15 minutes.

## Phase 1: The Initial Login
Upon your first login, you are greeted by the **Command Center**. This dashboard is your telemetry hub.
1. **Verify your credentials**: Ensure your user profile has the 'Owner' badge in the top right.
2. **Check the System Status**: In the bottom left of the sidebar, you'll see the system pulse. Green means all systems (API, Database, AI) are nominal.

## Phase 2: Core Configuration
Before inviting clients or team members, you must define your agency's physics.
1. Navigate to **Settings** (bottom left).
2. Select **Agency Identity**.
3. Input your **Agency Name** and **Legal Entity**. These appear on all invoices.
4. Upload your **Logo** (SVG or PNG preferred, max 2MB).
5. Set your **Primary Domain**. This is used for white-labeling client portals.

## Phase 3: Financial Foundation
Zify AI cannot process transactions without a currency baseline.
1. Go to **Settings > Fiscal Command**.
2. Select your **Global Currency** (USD, EUR, GBP, etc.).
3. Set your **Base Tax Rate**. This is the default VAT/GST applied to new invoices.
4. (Optional) Toggle **Auto-Dispatch**. If enabled, invoices are emailed immediately upon creation.

## Phase 4: Your First Service
Populate your catalog so you have something to sell.
1. Go to **Services** in the sidebar.
2. Click **New Offering**.
3. Define the **Service Name** (e.g., "SEO Audit").
4. Choose **Pricing Model**: 'Standard' for one-off, 'Recurring' for retainers.
5. Set the price and click **Publish Live**.

## Next Steps
You are now ready to invite your team. Navigate to the **Team** module to begin provisioning accounts.`,

  '2': `# Configuring your Agency Identity

Your Agency Identity is the fingerprint of your workspace. It dictates how you appear to clients in the portal, on invoices, and in email notifications.

## Accessing Identity Controls
Navigate to **Settings** via the sidebar gear icon. The first section you see is **Agency Identity**.

## Visual Branding
*   **Logo**: Upload a high-resolution image. This asset is dynamically resized for email headers (50px height) and invoice PDFs (80px height).
*   **Accent Color**: In **Settings > Interface**, choose a color that matches your brand (Blue, Indigo, Rose, or Emerald). This changes buttons, links, and active states globally.

## Legal Parameters
*   **Legal Business Entity**: Enter your full registered company name (e.g., "Vexel Digital LLC"). This is critical for tax compliance on generated invoices.
*   **Primary Command Domain**: Enter your website URL. In the Enterprise plan, this allows for CNAME mapping (e.g., \`portal.youragency.com\`).

## Localization
*   **Timezone**: Ensure this matches your headquarters. All deadlines and timestamps in the **Calendar** and **Activity Log** will sync to this setting.
*   **Date Format**: Currently defaults to \`MM/DD/YYYY\` for US compatibility or \`DD/MM/YYYY\` for international based on your browser locale.`,

  '3': `# Setting up your first Workspace

A Workspace in Zify AI represents a distinct business unit. While most users only need one, Enterprise plans support multiple workspaces for holding companies.

## Workspace Architecture
Your workspace contains:
*   **Team Members**: User accounts with access to this data.
*   **Clients**: External profiles associated with this entity.
*   **Financial Data**: Invoices, Estimates, and Revenue stats specific to this business unit.

## Configuration Steps
1.  **Dashboard Layout**: In **Settings > Command Matrix**, toggle visibility for the modules you use. If you don't do software dev, hide the "Tickets" module to reduce clutter.
2.  **Notification Channels**: In **Settings > System Feedback**, configure where you want alerts (Email, Browser Push, or Slack Webhook).
3.  **Security Policy**: Set your **Session Timeout** duration. For high-security environments, we recommend 15 minutes.`,

  '4': `# Inviting Team Members & Roles

Zify AI uses a Role-Based Access Control (RBAC) system to ensure security.

## The Invitation Process
1.  Go to the **Team** page.
2.  Click the **Add Team Member** button in the top right.
3.  Enter the **Email Address** and **Full Name**.
4.  Select a **Department** (Engineering, Creative, Operations, etc.). This helps with filtering the schedule.
5.  Assign a **Role**:
    *   **Admin**: Full access to all settings, billing, and data.
    *   **Manager**: Can manage projects and clients but cannot change agency settings or delete critical data.
    *   **Staff**: Can view tasks assigned to them and log time. Cannot see financial totals.
    *   **Contractor**: Limited view. Can only see tasks explicitly assigned to them.`,

  '5': `# Understanding the Command Center

The Dashboard is your mission control. It aggregates data from all modules into a single pane of glass.

## Key Telemetry Widgets
*   **Revenue Trends**: A real-time area chart showing gross revenue over time. It compares current period vs. previous period.
*   **Active Clients**: The total count of clients with at least one "In Progress" mission or active retainer.
*   **Total Production**: A summary of hours logged by your team in the current billing cycle.
*   **Recent Requests**: A feed of the last 5 incoming tickets or mission requests.

## Customization
You can toggle widgets on/off in **Settings > Command Matrix**.
*   **Show Revenue**: Hide this if you are screen-sharing with clients or junior staff.
*   **Show Activity**: Useful for admins monitoring system usage but can be noisy.`,

  '6': `# Importing Data from Legacy Systems

Migrating to Zify AI is designed to be painless via our CSV Import Engine.

## Preparing Your Data
We support standard CSV format. Your file should have headers.
*   **Clients**: Name, Email, Company, Phone, Revenue, Status.
*   **Contacts**: First Name, Last Name, Email, Phone.

## The Import Wizard
1.  Navigate to **Marketing > Audience**.
2.  Click the **Import CSV** card.
3.  Upload your file.
4.  **Map Columns**: The system will attempt to auto-match headers (e.g., "Email Address" -> "email"). Verify these mappings manually.
5.  **Run Import**: Click "Start". Large files (10k+ rows) may take a few minutes to process.`,

  '7': `# Setting up Global Currency & Tax

Zify AI creates financial documents that must be legally compliant.

## Currency Configuration
1.  Go to **Settings > Fiscal Command**.
2.  Select your **Global Currency** from the dropdown.
3.  **Impact**: This symbol ($ , €, £) will update across all Dashboards, Invoices, and Reports immediately. Note that this does *not* convert existing numerical values; it only changes the display symbol.

## Tax Rules
1.  **Base Taxation (%)**: Enter your standard rate (e.g., 20 for VAT).
2.  **Tax Inclusive Mode**: Toggle this if your service prices already include tax.
    *   *OFF*: $100 Service + 20% Tax = $120 Total.
    *   *ON*: $120 Service (includes $20 Tax).`,

  '8': `# Navigating the Sidebar Interface

The Zify AI sidebar is divided into logical operational clusters.

## 1. Hub
*   **Dashboard**: High-level metrics.
*   **Activity Log**: Audit trail of every action taken in the workspace.
*   **Requests**: The core work queue.
*   **Tickets**: Client support issues.
*   **Zify AI**: Your operational co-pilot.

## 2. Operations
*   **Pipeline**: CRM deal flow (Kanban).
*   **Calendar**: Global schedule view.
*   **Bookings**: Meeting scheduler links.
*   **Clients**: Directory of partners and companies.
*   **Services**: Your product catalog.`,

  '9': `# Mobile App Configuration

Zify AI is a Progressive Web App (PWA), meaning it can be installed on your mobile device without an App Store download.

## Installation on iOS
1.  Open Zify AI in **Safari**.
2.  Tap the **Share** button (box with arrow).
3.  Scroll down and tap **Add to Home Screen**.
4.  The app icon will appear on your grid.

## Installation on Android
1.  Open Zify AI in **Chrome**.
2.  Tap the **three dots** menu in the top right.
3.  Tap **Install App** or **Add to Home Screen**.`,

  '10': `# Security Best Practices for Agencies

Protecting your client data is paramount. Zify AI provides several layers of defense.

## 1. Multi-Factor Authentication (MFA)
Go to **Settings > Security Matrix** and toggle **Double Auth**. This requires a code from your email or authenticator app for every new device login.

## 2. Session Timeouts
Configure **Terminal Timeout** in Settings. We recommend 60 minutes for office environments and 15 minutes for remote/coffee shop work.

## 3. Role Restriction
Follow the "Principle of Least Privilege". Do not give 'Admin' access to staff who only need to execute tasks. Use the 'Staff' or 'Contractor' roles.`,

  // --- SECTION 2: CLIENTS & CRM ---
  '11': `# Adding Client Profiles to Registry

The Client Registry is your address book.

1.  Navigate to **Clients**.
2.  Click the **Onboard New Partner** button.
3.  **General Tab**:
    *   **Entity Name**: The legal company name.
    *   **Authorized Contact**: Your main point of contact (POC).
    *   **Email**: Critical. This is where invoices and notifications are sent.
4.  **Project Tab**: Define their budget range and main objectives.
5.  **Permissions Tab**:
    *   **Portal Access**: Toggle 'View' or 'Edit' for modules they can see in their client portal.
    *   **Onboarding Flow**: Select which automated intake form they should receive.`,

  '12': `# Managing Client Status (Lead vs Active)

Zify AI distinguishes between potential business and active contracts.

## Status Definitions
*   **Lead**: A prospect. They have a profile but no active billing. They do *not* count towards your "Active Client" plan limit.
*   **Active**: A paying partner with ongoing projects or retainers.
*   **Past**: A former client. Data is preserved but archived from main views.
*   **Draft**: A profile being set up, not yet visible to the rest of the team.

## Changing Status
1.  Open a Client Profile.
2.  Click the status badge (e.g., the blue "Lead" pill).
3.  Select the new status from the dropdown.`,

  '13': `# Setting up Client Portal Access

The Client Portal allows your partners to view project status, pay invoices, and approve documents without emailing you.

## Configuring the Portal
1.  Go to **Clients** and select a client.
2.  Click **Edit Profile** > **Permissions**.
3.  **Module Access**: Check the boxes for areas they should see.
    *   *Requests*: Let them submit new work.
    *   *Billing*: Let them see and pay invoices.
    *   *Files*: Read-only access to delivered assets.
4.  **Save**.

## Invitation
Send the "Portal Uplink" via the **Send Invite** button in the client profile. This generates a secure, magic link.`,

  '14': `# Customizing Onboarding Flows

Onboarding Flows are automated sequences of forms and tasks sent to new clients.

1.  Navigate to **Onboarding**.
2.  Click **Create Protocol**.
3.  **Sequence Tab**: Add steps like "Identity", "Contract", "Billing", "Form".
4.  **Configure Steps**:
    *   *Form*: Add fields for them to fill out (e.g., "Brand Colors", "Target Audience").
    *   *Contract*: Paste your markdown legal text.
    *   *Billing*: Attach a predefined service for immediate payment.
5.  **Publish**: Set status to "Live".`,

  '15': `# Tracking Client LTV & Revenue

Lifetime Value (LTV) is a critical metric for agency health.

## Where to find it
*   **Client List**: The "Projected Value" column shows total revenue collected + outstanding invoices.
*   **Client Profile**: The "Fiscal Health" card displays detailed breakdown of Paid vs Pending.
*   **Reports**: Go to **Reports > Financial**. The "Revenue Composition" chart breaks down income by client cohort.

## Improving LTV
Use the **Marketing** module to set up "Upsell Campaigns". For example, create a segment of clients who purchased "Web Design" but not "SEO Maintenance", and send them a targeted offer.`,

  '16': `# Pipeline Management Strategies

The **Pipeline** module is your CRM Kanban board.

## Default Stages
*   **Inbound**: New leads from your website or referrals.
*   **Discovery**: You've had a meeting, but no proposal yet.
*   **Solutioning**: Proposal sent, awaiting signature.
*   **Closed Won**: Signed and paid.
*   **Closed Lost**: Did not convert.

## Moving Deals
Drag and drop cards between columns.
*   **Pro Tip**: Dragging a card to "Closed Won" can trigger an automation to create a Client Profile and send an Onboarding Flow (configure this in **Automation**).`,

  '17': `# Configuring Deal Stages

Every agency's sales process is different. You can customize your pipeline.

1.  Go to **Pipeline**.
2.  Click the dropdown on the top left (Pipeline Name).
3.  Select **Edit Pipeline** (or create a new one).
4.  **Add Stage**: Click "+" to add a column.
5.  **Rename**: Click any stage name to rename it.
6.  **Reorder**: Drag columns left/right.
7.  **Delete**: Click the "X" on a column.`,

  '18': `# Lead Scoring & Probability

Lead Scoring helps you prioritize effort.

## Manual Scoring
In the Deal modal, you can manually set a **Priority** (Low, Medium, High). This visual badge helps sales staff scan the board.

## Probability Math
Each deal has a **Value** ($) and **Probability** (%).
The **Weighted Value** (visible in the Pipeline header) = Total Value * Probability.
*   Example: A $10,000 deal at 50% probability contributes $5,000 to your weighted forecast.`,

  '19': `# Automated Follow-up Protocols

Don't let leads go cold.

1.  Go to **Automation**.
2.  Create a new Workflow: "Lead Nurture".
3.  **Trigger**: "Deal Stage Change" -> "Inbound".
4.  **Wait**: 2 Days.
5.  **Condition**: "Email Interaction" -> "Has NOT Replied".
6.  **Action**: "Send Email" -> Template: "Checking In".`,

  '20': `# Exporting CRM Data to CSV

You own your data.

1.  Go to **Pipeline** or **Clients**.
2.  Click the **Export** (Download icon) button in the top right.
3.  Select the dataset (Current View or All Data).
4.  The system generates a \`.csv\` file containing Name, Email, Company, Value, Stage, and Last Contact date.

This file is compatible with Excel, Google Sheets, and other CRM import tools.`,

  '21': `# Syncing Email Contacts

To import contacts from Gmail or Outlook:

1.  Go to **Marketing > Audience**.
2.  Click **Data Sources**.
3.  Select "Custom API" or use the manual CSV import method.
4.  Upload your contact export file.
5.  Map the columns (Email -> Email, Name -> Name).

These contacts enter the system as "Leads" and are available for Marketing Broadcasts.`,

  '22': `# Managing Multiple Stakeholders

Often, a client company has multiple people (CEO, Marketing Manager, Billing Dept).

## Adding Contacts
1.  Open the **Client Profile**.
2.  In the "Contacts" section, click **+ Add Contact**.
3.  Enter their details.

## Role Assignment
*   **Primary**: Receives general notifications.
*   **Billing**: Receives invoices.
*   **Technical**: Receives dev updates.`,

  '23': `# Client Retention Reporting

Churn is the enemy.

1.  Go to **Reports > Operational**.
2.  View the **Client Retention** chart.
3.  **Cohort Analysis**: This table shows you retention rates by sign-up month. (e.g., "Do clients who joined in January stay longer than those in June?").

## Red Flags
If you see a drop-off at Month 3, your onboarding might be good, but your ongoing service delivery is lacking. Investigate "Month 3" tickets to find the cause.`,

  '24': `# Archiving Inactive Accounts

Keep your workspace clean.

1.  Go to **Clients**.
2.  Find the client to remove.
3.  Click **More (...)** > **Decommission**.
4.  Confirm the action.

## What happens?
*   The client is moved to "Past" status.
*   They lose access to the portal immediately.
*   Their data (invoices, files) is **NOT** deleted.`,

  '25': `# Client Tagging Taxonomy

Tags allow flexible grouping beyond "Status".

## Usage Examples
*   **Industry**: #Tech, #Healthcare, #Retail
*   **Tier**: #VIP, #Standard, #Legacy-Pricing
*   **Tech Stack**: #Shopify, #React, #WordPress

## Filtering
In the **Clients** list, type a tag name into the search bar to filter instantly.
In **Marketing**, you can create segments based on these tags.`,

  // --- SECTION 3: PROJECTS & MISSIONS ---
  '26': `# Creating a New Mission Request

Missions are the core unit of work in Zify AI.

1.  Go to **Requests**.
2.  Click **New Request**.
3.  **Title**: Be descriptive (e.g., "Q4 Homepage Redesign").
4.  **Client**: Select the partner entity.
5.  **Service**: Categorize it.
6.  **Priority**: 'High' priority missions float to the top of the queue.
7.  **Description**: Use the rich text editor to provide requirements.
8.  **Assignee**: Who is the lead operative?
9.  **Click Initialize**.`,

  '27': `# Assigning Team Members to Tasks

1.  Open a **Mission** or **Task**.
2.  Locate the "Assigned Operative" dropdown.
3.  Select a team member.

## Workload Balancing
Before assigning, check **Schedules > Team Availability**.
*   If a member is at 100% Load, assigning them more work will trigger a warning.
*   Distribute tasks to keep utilization between 70-80% for optimal performance.`,

  '28': `# Setting Priority & Risk Levels

Proper prioritization prevents bottlenecks.

*   **Low**: "Nice to have". No deadline pressure. Fill-in work.
*   **Medium**: Standard delivery. Normal SLA applies (e.g., 3-5 days).
*   **High**: Urgent. Requires immediate scheduling. Bumps other tasks.

## Risk Level (Hidden Field)
The system calculates hidden "Risk" based on:
1.  Tightness of deadline.
2.  Complexity of the service type.
3.  Assignee's current load.`,

  '29': `# Understanding Credit Consumption

For agencies using a "Credits" or "Points" pricing model.

1.  Define credit costs in **Services** (e.g., "Blog Post" = 2 Credits).
2.  When a **Mission** is created linked to that service, the system reserves the credits.
3.  When the Mission is **Completed**, the credits are deducted from the Client's balance.

## Top-Up
Clients can buy more credits via the portal (handled in **Billing**).`,

  '30': `# File Asset Management in Missions

Every mission has a dedicated **Asset Repository**.

1.  Open the Mission.
2.  Click the **Files** tab.
3.  Drag and drop designs, docs, or contracts.
4.  **Version Control**: If you upload a file with the same name, Zify AI treats it as a new version v2, v3, etc.

## Client Access
Files uploaded here are visible to the client in their portal. Use the **Internal Notes** tab for files you don't want them to see yet.`,

  '31': `# Using the Checklist System

Standard Operating Procedures (SOPs) ensure quality.

1.  Open a Mission.
2.  Go to **Checklists**.
3.  Add items manually or load a preset template.
4.  As you work, check off items.

## Validation
You cannot mark a Mission as "Completed" if there are unchecked items in the checklist (unless you force-override as Admin). This prevents accidental delivery of unfinished work.`,

  '32': `# Duplicating Mission Blueprints

Save time on recurring projects.

1.  Create a "Master Mission" with all standard checklists, files, and descriptions.
2.  In the **Requests** list, click the **three dots** menu on that mission.
3.  Select **Duplicate**.
4.  Rename it and assign it to the new client.

This copies the entire structure, preserving your SOPs.`,

  '33': `# Kanban vs List View Workflows

Zify AI supports both work styles.

*   **List View**: Best for density. Use this during morning stand-ups to scan 50+ items quickly by due date.
*   **Kanban View**: Best for flow. Use this to visualize bottlenecks.
    *   Drag cards from "Pending" to "In Progress".
    *   If a column gets too long, you know where the jam is.`,

  '34': `# Filtering Missions by Status

Don't get overwhelmed by the noise.

Use the filter bar at the top of **Requests**:
*   **All**: Everything history.
*   **Pending**: Inbox zero target. Triage these first.
*   **In Progress**: What is currently being burned down.
*   **Overdue**: Critical fires. Handle immediately.
*   **Completed**: For review or invoicing.`,

  '35': `# Archiving Completed Projects

Keep your active board clean.

1.  When a mission is done and paid for, don't leave it in "Completed" forever.
2.  Click the menu > **Archive**.
3.  It moves to "Storage" and no longer appears in default queries.
4.  It *does* remain in reports and client history.`,

  '36': `# Collaborating via Comments

Stop using email for project comms.

1.  Open a Mission.
2.  Use the **Activity** tab.
3.  Type your update.
4.  **@Mention**: Type \`@\` to notify a team member. They will get a ping.
5.  **Client Visibility**: By default, comments are internal. Toggle the "Public to Client" switch if you want the client to see the update in their portal.`,

  '37': `# Setting Strategic Deadlines

Deadlines drive delivery.

1.  In the Mission Create/Edit screen, set the **Due Date**.
2.  **SLA Warning**: If the date is sooner than your standard turnaround time (e.g., < 48 hours), the system will flag it as "Rush".
3.  **Calendar Sync**: This date automatically appears on the **Calendar** view for the assignee.`,

  '38': `# Linking Projects to Invoices

Connect money to work.

1.  When creating an **Invoice**, you'll see a "Link to Mission" option in the Settings panel.
2.  Select the relevant Mission(s).
3.  **Result**:
    *   The invoice will auto-populate with the Mission title.
    *   The Mission will show a "Billed" badge.`,

  '39': `# Managing Scope Creep

When a client asks for more than agreed.

1.  Do not just add it to the checklist.
2.  Create a **New Request** for the extra work.
3.  Link it to the original project as a "Sub-task" or "Phase 2".
4.  Send a specific **Estimate** for this new request.`,

  '40': `# Project Health Monitoring

How do you know if a project is off track?

Look for the **Health Indicators** in the **Reports** module:
*   **Green**: On time, under budget.
*   **Yellow**: Approaching deadline with <50% checklist completion.
*   **Red**: Overdue or over-budget (hours logged > estimate).`,

  // --- SECTION 4: FINANCE & BILLING ---
  '41': `# Creating Your First Invoice

Getting paid is the goal.

1.  Navigate to **Billing**.
2.  Click **New Invoice**.
3.  **Client**: Select from registry. Address fills automatically.
4.  **Line Items**: Click "Add Item".
5.  **Settings**: Check "Tax" if applicable.
6.  **Finalize**: Click "Create".
7.  **Send**: Click "Send" to email it immediately via the platform.`,

  '42': `# Setting Up Recurring Retainers

Automate your monthly revenue.

1.  In **Services**, ensure you have a "Recurring" service created.
2.  Go to **Billing > New Invoice**.
3.  In Settings, change type from "Single" to **Retainer**.
4.  Select the **Interval** (Monthly).
5.  Enable **Auto-Pay** (if the client has a card on file).
6.  Enable **Auto-Dispatch**.`,

  '43': `# Configuring Stripe Integration

Stripe is the financial backbone of Zify AI.

1.  Navigate to **Settings > Fiscal Command** (Billing Settings).
2.  Locate the "Payment Gateways" section card.
3.  Toggle the **Stripe Integration** switch to "Active".
4.  Enter your **Secret Key** (starts with \`sk_live_...\`) and **Publishable Key** (starts with \`pk_live_...\`) in the secure fields.
5.  Click **"Verify Connection"** to initiate a handshake test transaction.`,

  '44': `# Managing Tax Rates & VAT

Compliance is built-in.

1.  Go to **Settings > Fiscal Command**.
2.  Set your **Global Tax Rate** (e.g., 20%).
3.  **Compound Tax**: If you need to stack taxes (e.g., provincial + federal), enable "Compound Mode".
4.  **Tax ID**: Enter your VAT/GST number in "Agency Identity". It will appear on all PDF footers.`,

  '45': `# Sending Estimates & Proposals

Secure the deal before doing the work.

1.  Go to **Estimates**.
2.  Click **Draft Quote**.
3.  Build it just like an invoice.
4.  **Terms**: Add specific scope limitations in the notes.
5.  **Send**: Email it to the client.

## Client Experience
The client receives a link. They can view the proposal and click **"Approve"**. You get a notification immediately.`,

  '46': `# Converting Estimates to Invoices

When a client approves a quote:

1.  Go to **Estimates**.
2.  Find the "Accepted" estimate.
3.  Click the menu (three dots) > **Convert to Invoice**.
4.  The system creates a new **Draft Invoice** copying all line items and prices.
5.  Review and **Send**.`,

  '47': `# Customizing Invoice Branding

Look professional.

1.  In the **Invoice Editor** (or Settings), verify your Logo is high-res.
2.  **Colors**: The invoice accent color is pulled from your Global Accent setting.
3.  **Template**: In the Invoice Editor > Settings, choose a layout: Standard, Bold, or Classic.
4.  **Footer**: Add your bank details or "Thank You" note in the global footer settings.`,

  '48': `# Tracking Overdue Payments

Cash flow control.

1.  Go to **Billing**.
2.  Filter by **Overdue**.
3.  **Visuals**: Overdue invoices have a red status badge.
4.  **Action**: Click the menu > **Resend Reminder**.
5.  **Automation**: Enable "Automated Payment Reminders" in settings to have the system do this for you.`,

  '49': `# Automated Payment Reminders

Stop chasing money manually.

1.  Go to **Settings > Fiscal Command > Operations**.
2.  Toggle **Smart Reminders**.
3.  **Cadence**: The default protocol is:
    *   *Reminder 1*: 3 days before due.
    *   *Reminder 2*: On due date.
    *   *Reminder 3*: 3 days after due (Overdue Notice).`,

  '50': `# Handling Multi-Currency Clients

Global agency support.

1.  Zify AI defaults to your Global Currency (e.g., USD).
2.  If you have a client in Europe:
    *   Create a New Invoice.
    *   In Settings, change Currency to **EUR**.
    *   Enter prices in EUR.
3.  **Reporting**: The Dashboard will convert that EUR amount back to USD (based on current forex rates) for your aggregate revenue total.`,

  // --- SECTION 5: ADVANCED FINANCE (51-60) ---
  '51': `# Exporting Financial Reports

For deep analysis or handing off to your accountant.

1.  Navigate to **Reports > Financial**.
2.  Click the **Export** button in the top right corner.
3.  Select **Format**: 'CSV' for raw data or 'PDF' for a visual summary.
4.  **Date Range**: Ensure your filter (e.g., 'Last 30 Days' or 'YTD') matches the period you want to export.
5.  **Download**: The system will generate a \`financial_report_{date}.csv\` containing Revenue, Expenses, Net Profit, and outstanding balances.`,

  '52': `# Understanding Agency Credit System

Credits are an internal currency used for AI consumption and service productization.

## AI Usage
Every time you use Zify AI or generate marketing copy, you consume **System Credits**.
*   **Text Generation**: ~1-3 credits per request.
*   **Image Analysis**: ~10 credits per image.
*   **Balance**: Check your balance in the sidebar or **Settings > Subscription**.

## Service Usage
You can also price your services in Credits (e.g., "Blog Post = 5 Credits"). This allows you to sell "Retainer Packs" (e.g., 100 Credits/mo) that clients can spend flexibly on different tasks.`,

  '53': `# Purchasing Additional Credits

Running low on AI power?

1.  Navigate to **Billing > Top Up**.
2.  Choose a **Credit Pack**:
    *   *Starter Boost*: 500 Credits ($5)
    *   *Growth Pack*: 1,500 Credits ($12)
    *   *Power User*: 5,000 Credits ($35)
3.  **Checkout**: Use your saved card or add a new one.
4.  **Activation**: Credits are added to your workspace immediately upon successful payment.`,

  '54': `# Managing Agency Subscription

Control your Zify AI platform tier.

1.  Go to **Billing > Plans**.
2.  **Current Plan**: You will see your active tier highlighted (e.g., Pro, Enterprise).
3.  **Upgrade**: Click "Select Plan" on a higher tier to unlock more seats, storage, or AI limits.
4.  **Billing Cycle**: Toggle between Monthly and Annual (Annual saves ~20%).
5.  **Downgrade**: To downgrade, please contact support to ensure no data loss (e.g., if you are over the storage limit of the lower plan).`,

  '55': `# Applying Discounts & Coupons

Incentivize payments or run promotions.

## On Invoices
1.  Open an Invoice in **Edit Mode**.
2.  In the right-hand settings panel, locate the **Discount** field.
3.  Enter a percentage (e.g., 10 for 10% off). The total calculates automatically.

## On Onboarding Forms
In the **Onboarding Builder**, add a "Coupon" block. You can define a valid code (e.g., "WELCOME20") and the discount amount. Clients entering this code during checkout will receive the reduction.`,

  '56': `# Setting Invoice Prefixes

Customize your document serialization.

1.  Go to **Settings > Fiscal Command**.
2.  Locate **Invoice Prefix**.
3.  Default is \`INV-\`. Change it to your agency initials (e.g., \`ACME-\`).
4.  **Result**: Your next invoice will be \`ACME-1001\`, \`ACME-1002\`, etc.
5.  **Note**: This change applies to *future* invoices only. Past invoices retain their original IDs for audit consistency.`,

  '57': `# Viewing Transaction History

A complete ledger of all payments.

1.  Navigate to **Billing**.
2.  The main table shows recent invoices.
3.  **Filter**: Use the status pills to show only 'Paid' invoices.
4.  **Details**: Click on any row to see the specific transaction ID, payment method used (e.g., Visa ending in 4242), and timestamp.
5.  **Refunds**: Transaction history also records any processed refunds or chargebacks.`,

  '58': `# Processing Refunds

If you need to return funds to a client.

1.  Go to **Billing**.
2.  Locate the **Paid** invoice.
3.  Click the **More Options (...)** menu.
4.  Select **Issue Refund**.
5.  **Partial vs Full**: You will be prompted to enter the amount. You can refund the full amount or a partial sum.
6.  **Confirmation**: This action communicates with Stripe immediately and cannot be undone. The client will receive an email notification.`,

  '59': `# Late Fee Configuration

Automatically penalize overdue payments.

1.  Go to **Invoice Editor > Settings > Financial Strategy**.
2.  Toggle **Penalty System**.
3.  **Default**: The system applies a 5% compounding fee for every 30 days overdue.
4.  **Application**: This fee is added as a line item ("Late Payment Surcharge") when the invoice status flips to 'Overdue'.
5.  **Manual Override**: You can remove this fee manually if you negotiate with the client.`,

  '60': `# Secure Payment Links

Send a payment request without a full invoice PDF.

1.  Create an Invoice or Estimate.
2.  Click **Save**.
3.  Click the **Share** icon (top right).
4.  Select **"Copy Link"**.
5.  **The Link**: This generates a secure, hosted URL (e.g., \`agencyos.io/pay/inv_123xyz\`).
6.  **Usage**: Send this link via WhatsApp, Slack, or SMS. The client sees a simple checkout page with Apple Pay/Google Pay options.`,

  // --- SECTION 6: AI & AUTOMATION (61-80) ---
  '61': `# Introduction to Zify AI

**Zify AI** is your operational co-pilot. It is not just a chatbot; it has read-access to your workspace data (strictly permissioned).

## Capabilities
*   **Context Aware**: It knows your active clients, recent projects, and revenue stats.
*   **Drafting**: It can write emails, proposals, and contract clauses.
*   **Analysis**: It can look at your financial reports and suggest cost-saving measures.

## Privacy
Your data is **never** used to train public models. It is processed in an ephemeral, stateless session securely via Google's enterprise-grade Gemini API.`,

  '62': `# Using Strategic Mode for Planning

The AI has different "Modes" (Personas). **Strategic Mode** is for business owners.

## How to use it
1.  Open **Zify AI**.
2.  Select **Strategic Mode** (Blue/Chart Icon).
3.  **Prompts**: Ask high-level questions like:
    *   "Analyze my revenue trend for Q3."
    *   "Suggest a pricing strategy for a new SEO package."
    *   "Draft a quarterly review email for client [Client Name]."

## Tone
Strategic Mode is concise, data-driven, and formal. It focuses on ROI, growth, and risk mitigation.`,

  '63': `# Generating Creative Briefs

**Creative Mode** is designed for designers, writers, and marketers.

## How to use it
1.  Open **Zify AI**.
2.  Select **Creative Mode** (Purple/Pen Icon).
3.  **Temperature**: This mode has a higher "Temperature" (0.9), meaning it is more imaginative and less deterministic.
4.  **Prompts**:
    *   "Generate 5 taglines for a coffee brand."
    *   "Write an Instagram caption for this image [upload image]."
    *   "Create a moodboard description for a cyberpunk website."`,

  '64': `# Analyzing Images with Multimodal AI

Zify AI can "see" images.

1.  Open **Zify AI**.
2.  Click the **Paperclip** or **Image** icon in the input bar.
3.  Upload a design mockup, a screenshot of a website, or a photo.
4.  **Prompt**: "Critique this UI design," or "Extract the text from this invoice."
5.  **Result**: The AI will analyze the visual data and respond textually.`,

  '65': `# Configuring AI Creativity Temperature

You can tune how "wild" or "predictable" the AI is.

1.  Go to **Settings > Neural Intelligence**.
2.  Locate the **Neural Temperature** slider.
3.  **Low (0.0 - 0.3)**: Precise, factual, deterministic. Good for legal contracts and financial data.
4.  **High (0.7 - 1.0)**: Creative, varied, unexpected. Good for brainstorming and marketing copy.
5.  **Default**: 0.7 is the standard balance.`,

  '66': `# Exporting AI Intel Reports

Save your conversation for later.

1.  In the AI chat window, click **Export Intel** (Download icon).
2.  The system generates a \`.txt\` transcript of the entire session.
3.  **Usage**: Useful for saving brainstormed ideas or documenting a strategic analysis session to share with your co-founder.`,

  '67': `# Building Automation Workflows

Automations are "If This, Then That" rules for your agency.

1.  Navigate to **Automation**.
2.  Click **New Workflow**.
3.  **The Canvas**: You will see a node-based editor.
4.  **Drag & Drop**: Drag nodes from the library on the left.
5.  **Connecting**: Click the handle (dot) on the right side of a node and drag a line to the left handle of another node. This creates the flow of logic.`,

  '68': `# Understanding Triggers & Actions

Every workflow starts with a **Trigger**.

## Common Triggers
*   **New Lead**: Fires when a contact is created.
*   **Form Submission**: Fires when a client completes an onboarding form.
*   **Invoice Paid**: Fires when money hits your account.

## Common Actions
*   **Send Email**: Dispatches a pre-written message.
*   **Create Task**: Adds a todo item to your team's queue.
*   **Update Deal**: Moves a pipeline card to a new stage.
*   **Notify Team**: Sends an in-app alert.`,

  '69': `# Setting Up Email Autoresponders

The classic "Welcome Sequence".

1.  **Trigger**: New Lead (Source: Web Form).
2.  **Action**: Send Email (Template: Welcome).
3.  **Control**: Wait Delay (Duration: 2 Days).
4.  **Action**: Send Email (Template: Check-in).
5.  **Result**: Every new lead automatically gets these two emails, spaced 2 days apart, without you lifting a finger.`,

  '70': `# Automating Task Assignment

Route work based on client type.

1.  **Trigger**: Project Created.
2.  **Condition**: Check Field (Service Type == "SEO").
3.  **Action (True Path)**: Create Task (Assignee: SEO Specialist).
4.  **Action (False Path)**: Create Task (Assignee: Account Manager).

This ensures the right specialist gets the ticket immediately based on what was sold.`,

  '71': `# Conditional Logic in Workflows

Create branching paths.

1.  Drag a **Condition** node (Diamond shape) onto the canvas.
2.  **Configure**: Set the rule (e.g., "Deal Value > $10,000").
3.  **Outputs**: The node has two outputs: "Yes" (Top/Green) and "No" (Bottom/Red).
4.  **Routing**: Connect high-value deals to a "Notify CEO" action, and low-value deals to a standard "Send Email" action.`,

  '72': `# Webhook Integrations

Connect Zify AI to Zapier, Slack, or Slack.

1.  **Trigger**: Webhook Received.
2.  **Setup**: The system gives you a unique URL (e.g., \`api.agencyos.io/hooks/...\`).
3.  **External Tool**: In Zapier, set the action to "POST" to this URL.
4.  **Payload**: Send JSON data (e.g., \`{ "email": "client@gmail.com" }\`).
5.  **Zify AI**: You can use that email address in subsequent nodes (e.g., "Create Contact").`,

  '73': `# Testing & Debugging Workflows

Don't break production.

1.  **Test Run**: In the Automation builder, click the "Test Run" button (Play icon).
2.  **Simulation**: The system visualizes the flow. A yellow pulse travels down the lines, showing you exactly which path a theoretical data packet would take.
3.  **Logs**: Check the "Execution History" tab to see past runs, including successes and failures (e.g., "Email failed to send - Invalid Address").`,

  '74': `# AI Grounding with Web Search

Ensure AI answers are up-to-date.

1.  In **Settings > Neural Intelligence**, toggle **Grounding** to ON.
2.  **Effect**: When you ask the AI a question (e.g., "What is the current price of Ethereum?"), it will perform a real-time Google Search before answering.
3.  **Citations**: The AI response will include footnotes or links to the sources it used, ensuring accuracy.`,

  '75': `# Using AI for Contract Generation

Draft legal agreements in seconds.

1.  Open **Zify AI (Strategic Mode)**.
2.  **Prompt**: "Draft a service agreement for a Web Design project. Scope: 5 pages, $5000, 50% deposit. Include a clause for 2 rounds of revisions."
3.  **Result**: The AI generates a formatted markdown contract.
4.  **Usage**: Copy this text into the **Onboarding > Contract** block for your client to sign.`,

  '76': `# Automated Invoice Follow-ups

Chasing payments automatically.

1.  **Trigger**: Invoice Overdue.
2.  **Action**: Send Email (Template: Payment Reminder).
3.  **Control**: Wait 3 Days.
4.  **Condition**: Check Invoice Status (Is it still 'Unpaid'?).
5.  **Action (True)**: Notify Team (Urgent: "Client X hasn't paid").

*Note: There is also a simple global setting for this in Billing Settings, but the Workflow builder gives you more granular control.*`,

  '77': `# Lead Scoring Automation

Prioritize your pipeline.

1.  **Trigger**: Email Interaction (Opened).
2.  **Action**: Update Contact Field (Lead Score = Lead Score + 5).
3.  **Trigger**: Page Visit (Pricing Page).
4.  **Action**: Update Contact Field (Lead Score = Lead Score + 10).
5.  **Trigger**: Lead Score > 50.
6.  **Action**: Create Task (Sales Call).`,

  '78': `# AI Prompt Engineering Guide

How to get the best results from Zify AI.

*   **Be Specific**: Instead of "Write a post," say "Write a LinkedIn post about SEO trends for small businesses, under 200 words, enthusiastic tone."
*   **Provide Context**: "I am a design agency. My client is a luxury hotel."
*   **Iterate**: If the first result isn't perfect, reply "Make it shorter" or "Add more emojis."`,

  '79': `# Data Privacy in AI Processing

Your data security is guaranteed.

*   **Zero-Training**: We have a contractual agreement with our AI provider (Google). Data sent through the API is *not* stored or used to train their base models.
*   **Encryption**: All prompt data is encrypted in transit (TLS 1.3).
*   **Isolation**: Your data is isolated to your workspace context.`,

  '80': `# Optimizing Workflow Latency

Why is my automation slow?

*   **Standard**: Most actions happen instantly (ms).
*   **Queues**: Bulk emails or imports are queued. A delay of 1-5 minutes is normal for large batches.
*   **External APIs**: If your workflow relies on a Webhook or Grounding search, we are at the mercy of the external service's speed.
*   **Tip**: Avoid loops (e.g., Trigger: Update Contact -> Action: Update Contact) to prevent infinite cycles.`,

  // --- SECTION 7: MARKETING & EMAIL (81-100) ---
  '81': `# Creating Email Marketing Campaigns

Send blasts to your audience.

1.  Navigate to **Marketing > Campaigns**.
2.  Click **New Broadcast**.
3.  **Setup**: Name your campaign (internal) and set the Subject Line.
4.  **Audience**: Select a Segment (e.g., "All Subscribers" or "VIPs").
5.  **Design**: Use the drag-and-drop editor to build your email.
6.  **Send**: You can send immediately or schedule for later.`,

  '82': `# Designing Email Templates

Save time with reusable layouts.

1.  In the Email Editor, build a layout you like (Logo + Header + Footer).
2.  Click **Save as Template**.
3.  **Usage**: Next time you create a campaign, select this template from the library to start with your branding already in place.`,

  '83': `# Managing Audience Segments

Group your contacts for targeted messaging.

1.  Go to **Marketing > Audience**.
2.  **Filters**: Click "Filter".
    *   *Rule*: Revenue > $10,000 AND Status == 'Active'.
3.  **Save Segment**: Name it "High Value Active".
4.  **Dynamic**: This segment updates automatically. As soon as a client crosses the $10k threshold, they are added to this list.`,

  '84': `# A/B Testing Subject Lines

Optimize your open rates.

1.  In the Campaign settings, toggle **A/B Test**.
2.  **Variant A**: "Monthly Newsletter"
3.  **Variant B**: "🔥 You won't believe this update..."
4.  **Split**: The system sends A to 10% of the list and B to 10%.
5.  **Winner**: After 4 hours, the version with the higher Open Rate is sent to the remaining 80%.`,

  '85': `# Analyzing Campaign Performance

Did it work?

1.  Go to **Marketing > Analytics**.
2.  Click on a sent campaign.
3.  **Metrics**:
    *   *Open Rate*: % of people who viewed it.
    *   *Click Rate (CTR)*: % of people who clicked a link.
    *   *Bounce Rate*: % of emails that failed (invalid address).
    *   *Unsubscribes*: People who opted out.
4.  **Heatmap**: See exactly which links were clicked the most.`,

  '86': `# Setting Up Custom Domains

Send emails from @youragency.com.

1.  Go to **Settings > Marketing > Domains**.
2.  **Add Domain**: Enter your website domain.
3.  **DNS Records**: The system will provide 3 CNAME records (DKIM/SPF).
4.  **Verify**: Add these to your DNS provider (GoDaddy, Namecheap, Cloudflare) and click Verify.
5.  **Benefit**: Improves deliverability and prevents your emails from going to Spam.`,

  '87': `# Configuring Sender Identity

Who is this email from?

1.  In Campaign Settings, look for "Sender".
2.  **Name**: "Alex from Zify AI" (Personal) vs "Zify AI Team" (Brand).
3.  **Reply-To**: You can set a different address for replies (e.g., support@agencyos.io) than the sending address.`,

  '88': `# Importing Contacts for Marketing

Bulk add subscribers.

1.  Go to **Marketing > Audience > Import**.
2.  Upload CSV.
3.  **Consent**: You *must* check the box confirming these people gave you permission to email them (GDPR/CAN-SPAM compliance).
4.  **Tagging**: Optionally add a tag (e.g., "Import Jan 2024") to track this batch.`,

  '89': `# Using Dynamic Content Blocks

Personalize the message.

1.  In the Email Editor, use **Merge Tags**.
2.  **Syntax**: \`{{ contact.first_name }}\` or \`{{ company.name }}\`.
3.  **Fallback**: \`{{ contact.first_name | default: "there" }}\`. (Outputs "Hi there" if name is missing).
4.  **Result**: "Hi Sarah," looks much better than "Hi Customer,".`,

  '90': `# Multi-Armed Bandit Optimization

Advanced traffic routing.

1.  Go to **Marketing > Optimization**.
2.  Create a new Experiment.
3.  **Algorithm**: Select "Multi-Armed Bandit".
4.  **How it works**: Unlike A/B testing (which splits 50/50), Bandit algorithms dynamically route *more* traffic to the winning variation in real-time. This maximizes conversions *during* the test, rather than waiting for the end.`,

  '91': `# Conversion Funnel Tracking

Visualize the drop-off.

1.  Go to **Marketing > Analytics > Funnels**.
2.  **Define Steps**:
    *   Step 1: Email Sent.
    *   Step 2: Email Opened.
    *   Step 3: Link Clicked.
    *   Step 4: Form Submitted (Goal).
3.  **Chart**: The funnel chart shows the % conversion at each step, helping you identify the weak link (e.g., Great open rate, but bad click rate = Content issue).`,

  '92': `# Omnichannel Strategy Guide

Don't just rely on email.

1.  **Unified Inbox**: The **Inbox** module collects Email, SMS, and WhatsApp replies in one place.
2.  **Workflows**: You can mix channels.
    *   Send Email.
    *   If not opened in 2 days -> Send SMS (if phone number exists).
3.  **Retargeting**: Sync your email list to Facebook Ads to target your subscribers on social media.`,

  '93': `# Scheduling Broadcasts

Time it right.

1.  When sending a campaign, choose **Schedule**.
2.  **Timezone**: You can select "Recipient's Timezone".
3.  **Effect**: If you schedule for 9 AM:
    *   Users in London get it at 9 AM GMT.
    *   Users in New York get it at 9 AM EST (5 hours later).
    *   This ensures your email hits the top of the inbox when they start their day.`,

  '94': `# Understanding Open & Click Rates

Benchmarks for agencies.

*   **Open Rate**: Average is 20-25%. If yours is <15%, work on Subject Lines and Sender Name.
*   **Click Rate**: Average is 2-3%. If yours is <1%, ensure your Call to Action (Button) is clear and compelling.`,

  '95': `# Managing Unsubscribes & Bounces

List hygiene is critical.

*   **Hard Bounce**: Invalid email. System automatically blocks them from future sends.
*   **Soft Bounce**: Mailbox full. System retries 3 times, then blocks.
*   **Unsubscribe**: System adds them to a suppression list automatically.
*   **Warning**: Do not email unsubscribed users manually; it violates anti-spam laws.`,

  '96': `# Integrating with Social Media

1.  Go to **Marketing > Social**.
2.  Connect accounts (LinkedIn, Twitter).
3.  **Usage**: You can schedule social posts to go out at the same time as your email newsletter for maximum impact.`,

  '97': `# Using AI to Write Copy

Writer's block?

1.  In the Email Editor, click the **Magic Wand** icon on any text block.
2.  **Prompt**: "Rewrite this paragraph to be more exciting and punchy."
3.  **Generate**: The AI offers 3 variations. Click one to insert it.`,

  '98': `# Creating Landing Pages

Capture leads.

1.  Go to **Pages** module.
2.  Create New Page (Template: "Lead Magnet").
3.  **Form**: Add an intake form connected to your "New Leads" segment.
4.  **Publish**: The page gets a public URL (e.g., \`agency.com/ebook\`).
5.  **Link**: Use this URL in your email campaigns as the destination.`,

  '99': `# SEO Optimization Basics

Get your Pages found.

1.  In **Page Editor > Settings**.
2.  **Meta Title**: Keep it under 60 characters. Include keywords.
3.  **Meta Description**: 160 characters summary.
4.  **OG Image**: Upload an image that appears when the link is shared on social media.`,

  '100': `# Direct Mail Broadcasts

Sending physical letters (Enterprise+ Only).

1.  Go to **Marketing > Direct Mail**.
2.  Select Audience (Addresses must be valid).
3.  Upload Design (Postcard PDF).
4.  **Send**: Our print partner prints and mails the cards.
5.  **Tracking**: You can see when the batch hits the postal stream.`,

  // --- SECTION 8: OPERATIONS & PRODUCTIVITY ---
  '101': `# Using the Time Tracker

Accurate time logging is essential for profitability.

1.  **Sidebar**: Click the "Timesheets" tab.
2.  **Quick Timer**: Use the floating timer bar at the top of the screen. Enter a task name (e.g., "Design Homepage") and click **Start**.
3.  **Stop**: Click **Stop** when finished. The entry is logged automatically.
4.  **Manual**: If you forgot to track, click the **+ Log Time** button on the Timesheets page to enter duration manually.`,

  '102': `# Logging Manual Time Entries

Correcting or backfilling time.

1.  Go to **Timesheets**.
2.  Click the **Log Manual Entry** button.
3.  **Details**: Enter Date, Duration (e.g., 2h 30m), Project, and Task Description.
4.  **Billable**: Toggle "Billable" if this time should be charged to the client.
5.  **Save**: The entry appears in your daily log immediately.`,

  '103': `# Reviewing Team Utilization

Are your staff overworking or underutilized?

1.  Go to **Reports > Operational**.
2.  View the **Team Utilization** chart.
3.  **Bars**: Shows % of available hours logged.
    *   < 50%: Underutilized.
    *   70-85%: Optimal.
    *   > 90%: Risk of burnout.
4.  **Action**: Reassign tasks in the **Schedules** module if you see imbalances.`,

  '104': `# Billable vs Non-Billable Hours

Understanding your effective rate.

*   **Billable**: Time spent on client work that generates revenue.
*   **Non-Billable**: Internal meetings, admin, sales calls.
*   **Ratio**: Aim for a 75/25 split for production staff.
*   **Reporting**: In **Timesheets**, filter by "Billable" to see how much revenue-generating work was done this week.`,

  '105': `# Configuring Booking Pages

Your public calendar link.

1.  Go to **Bookings**.
2.  Click **New Booking Type**.
3.  **Details**: Set Title (e.g., "Discovery Call"), Duration (30 min), and Location (Zoom/Google Meet).
4.  **Availability**: Define your hours (e.g., Mon-Fri, 9am-5pm).
5.  **Share**: Copy the link to send to clients or embed on your website.`,

  '106': `# Syncing Google Calendar

Prevent double bookings.

1.  Go to **Settings > Integrations**.
2.  Click **Connect Google Calendar**.
3.  **Authorize**: Log in with your Google account.
4.  **Calendar Selection**: Choose which calendars to check for conflicts (e.g., Personal, Work).
5.  **Result**: Zify AI will not allow bookings during times you are busy on Google Calendar.`,

  '107': `# Setting Availability Windows

Control when you work.

1.  In **Bookings**, edit a specific Event Type.
2.  Go to the **Availability** tab.
3.  **Specific Hours**: You can set different hours for different meeting types (e.g., Sales calls only on Tuesdays/Thursdays).
4.  **Date Range**: Limit how far in the future people can book (e.g., "Rolling 30 Days").`,

  '108': `# Creating Booking Event Types

Different meetings for different needs.

*   **15 Min Intro**: Quick qualification call.
*   **60 Min Strategy**: Paid consultation.
*   **Support Sync**: For existing clients only.
*   **Create**: In **Bookings**, clone an existing type or start fresh to set up these variations.`,

  '109': `# Embedding Bookings on Website

Let clients book directly from your landing page.

1.  In **Bookings**, click the **Share** button on an event type.
2.  Select **Add to Website**.
3.  **Inline**: Displays the calendar directly on the page.
4.  **Popup**: Adds a floating button that opens the calendar.
5.  **Code**: Copy the HTML snippet and paste it into your website builder (WordPress, Webflow, etc.).`,

  '110': `# Managing Support Tickets

Centralized help desk.

1.  Go to **Tickets**.
2.  **Triage**: New tickets appear in "Unassigned".
3.  **Assign**: Click a ticket and assign it to a team member.
4.  **Reply**: Type your response in the thread. The client receives an email notification.
5.  **Status**: Change to "Pending" (waiting for client) or "Solved" when finished.`,

  '111': `# Ticket SLA & Priority Rules

Service Level Agreements.

*   **Low**: 48h response target.
*   **Medium**: 24h response target.
*   **High**: 4h response target.
*   **Critical**: 1h response target.
*   **Breach**: If a ticket exceeds its SLA time, it turns red and notifies the admin automatically.`,

  '112': `# File Storage & Organization

Your agency cloud drive.

1.  Go to **Storage**.
2.  **Folders**: Create folders for "Clients", "Internal", "Assets".
3.  **Upload**: Drag and drop files.
4.  **Client Folders**: Files inside a specific Client folder are automatically shared with that client in their portal.`,

  '113': `# Sharing Files Securely

Send assets without email attachments.

1.  In **Storage**, right-click a file.
2.  Select **Share**.
3.  **Link**: Generate a public link.
4.  **Expiry**: Optionally set an expiration date (e.g., "Link valid for 7 days") for security.
5.  **Password**: Add a password for sensitive documents.`,

  '114': `# Using Internal Wiki Pages

Build your knowledge base.

1.  Go to **Pages**.
2.  Create a new page with visibility **"Internal Team Only"**.
3.  **Content**: Document your SOPs, brand guidelines, and onboarding checklists.
4.  **Access**: Team members can search for these pages in the "Help" section.`,

  '115': `# Activity Log Auditing

Who did what, when?

1.  Go to **Activity**.
2.  **Filter**: By User, Action (Delete, Create), or Date.
3.  **Detail**: Click an entry to see the exact changes (e.g., "Changed Invoice #102 amount from $500 to $1000").
4.  **Security**: This log is immutable and serves as a permanent record for compliance.`,

  '116': `# Managing App Notifications

Reduce noise.

1.  Go to **Settings > Notifications**.
2.  **Channels**: Toggle Email, Browser, or Mobile Push.
3.  **Events**: Choose what triggers an alert (New Lead, Ticket Reply, Payment Received).
4.  **Digest**: Enable "Daily Digest" to get a single summary email instead of instant pings.`,

  '117': `# Exporting Time Reports

For payroll or client billing.

1.  Go to **Timesheets**.
2.  **Filter**: Select the date range (e.g., "Last Month") and Client.
3.  **Export**: Click the Download icon.
4.  **Format**: CSV or PDF.
5.  **Detail**: Choose "Summary" (Total hours per person) or "Detailed" (Every individual log entry).`,

  '118': `# Handling Meeting Conflicts

What happens if I'm double booked?

*   Zify AI prevents double bookings by checking your connected Google Calendar.
*   If a conflict occurs (e.g., manual override), both events remain.
*   **Alert**: You will see a "Conflict" warning in the **Calendar** view. You must manually reschedule one of the events.`,

  '119': `# Setting Up Custom Services

Define what you sell.

1.  Go to **Services**.
2.  Click **New Service**.
3.  **Details**: Name, Description, Price.
4.  **Type**:
    *   *One-off*: Standard project.
    *   *Recurring*: Subscription.
    *   *Credit-based*: Deducts credits from client balance.`,

  '120': `# Service Pricing Strategies

Best practices.

*   **Productized**: Fixed scope, fixed price (e.g., "Logo Design - $500"). Easier to sell, faster to deliver.
*   **Retainer**: Ongoing monthly fee (e.g., "Maintenance - $1000/mo"). Predictable revenue.
*   **Hourly**: Billed based on time logs. Good for undefined scope, but harder to scale.`,

  // --- SECTION 9: ADVANCED & DEVELOPER ---
  '121': `# Zify AI API Overview

Build your own integrations.

*   **Endpoint**: \`https://api.agencyos.io/v1/\`
*   **Auth**: Bearer Token (Get from Settings > Developer).
*   **Rate Limit**: 100 requests/minute.
*   **Docs**: Full Swagger documentation available at \`developer.agencyos.io\`.`,

  '122': `# Authentication & Tokens

Secure your API access.

1.  Go to **Settings > Developer**.
2.  **Generate Token**: Click "Create New API Key".
3.  **Permissions**: Select scopes (Read-only, Read/Write).
4.  **Store Securely**: The key is shown only once. If lost, you must regenerate it.`,

  '123': `# Webhooks Configuration

Real-time data push.

1.  Go to **Settings > Developer > Webhooks**.
2.  **Endpoint URL**: Enter the URL where you want to receive data.
3.  **Events**: Select triggers (e.g., \`contact.created\`, \`invoice.paid\`).
4.  **Verify**: We send a test POST request to ensure your server is listening.`,

  '124': `# Custom Domain DNS Setup

White-label your portal.

1.  Go to **Settings > Domain**.
2.  **Enter Domain**: e.g., \`portal.myagency.com\`.
3.  **DNS Records**: Add the provided CNAME record to your DNS provider (GoDaddy, Cloudflare, etc.).
    *   *Host*: \`portal\`
    *   *Value*: \`cname.agencyos.io\`
4.  **Verify**: Click "Verify". Propagation can take up to 24 hours.`,

  '125': `# Rate Limiting & Quotas

API usage rules.

*   **Standard Plan**: 1,000 API calls/day.
*   **Pro Plan**: 10,000 API calls/day.
*   **Enterprise**: Unlimited.
*   **Headers**: Check \`X-RateLimit-Remaining\` in API response headers to monitor usage.`,

  '126': `# Error Handling Best Practices

Coding for resilience.

*   **401 Unauthorized**: Check your API key.
*   **429 Too Many Requests**: You hit the rate limit. Implement exponential backoff.
*   **500 Server Error**: Our fault. Check status page.
*   **Timeouts**: Set your client timeout to 30s.`,

  '127': `# Integrating with Zapier

No-code automation.

1.  Accept our Zapier Invite (Link in Settings > Integrations).
2.  **Trigger**: Choose Zify AI as the trigger app (e.g., "New Lead").
3.  **Action**: Choose destination app (e.g., "Slack" -> "Send Channel Message").
4.  **Test**: Run the zap to verify data flow.`,

  '128': `# SSO Configuration (Enterprise)

Single Sign-On for your team.

1.  Go to **Settings > Security**.
2.  **Provider**: Select Google Workspace, Okta, or Azure AD.
3.  **Metadata**: Upload your IdP XML metadata file.
4.  **Enforce**: Toggle "Enforce SSO" to disable password logins for your domain.`,

  '129': `# Data Export API

Bulk data retrieval.

*   **Endpoint**: \`/v1/export/contacts\`
*   **Method**: GET.
*   **Format**: Returns a JSON stream or CSV download link.
*   **Use Case**: Nightly backups to your own data warehouse.`,

  '130': `# White-Labeling the Portal

Make it yours.

1.  **Domain**: Set up custom CNAME (see article 124).
2.  **Branding**: Upload your logo and favicon.
3.  **Colors**: Set your primary brand color. This affects buttons and accents.
4.  **Email**: Configure SMTP so notifications come from \`notifications@yourdomain.com\`.`,

  '131': `# GDPR & Compliance Features

Respect user privacy.

*   **Cookie Consent**: Enable the built-in cookie banner for public pages.
*   **Data Export**: "Download My Data" button for clients in their portal.
*   **Right to be Forgotten**: "Delete Account" function permanently scrubs PII.
*   **DPA**: Download our Data Processing Agreement in Settings > Legal.`,

  '132': `# Managing Multi-Org Accounts

For holding companies.

1.  Click your profile avatar -> **Switch Workspace**.
2.  **Create New**: Click "New Workspace".
3.  **Isolation**: Data (clients, finance) is completely isolated between workspaces.
4.  **Billing**: Each workspace has its own subscription (Enterprise plans may bundle billing).`,

  '133': `# Role-Based Access Control (RBAC)

Fine-grained permissions.

*   **Owner**: Super admin. Cannot be deleted.
*   **Admin**: Full access, except billing method changes.
*   **Manager**: Can view/edit all projects, cannot change agency settings.
*   **Editor**: Can edit assigned projects only.
*   **Viewer**: Read-only access to assigned projects.`,

  '134': `# Customizing Email SMTP

Send from your server.

1.  Go to **Settings > Email**.
2.  Select **Custom SMTP**.
3.  **Details**: Enter Host (e.g., \`smtp.gmail.com\`), Port (587), User, Password.
4.  **Test**: Click "Send Test Email".
5.  **Benefit**: Removes "via agencyos.io" from the sender header.`,

  '135': `# Audit Trail Export

Compliance logging.

1.  Go to **Settings > Security**.
2.  Click **Export Audit Log**.
3.  **Date Range**: Select period.
4.  **Download**: Get a CSV of every login, data change, and export event with IP addresses and timestamps.`,

  // --- SECTION 10: TROUBLESHOOTING & FAQ ---
  '136': `# Resetting Your Password

Locked out?

1.  On the Login screen, click **Forgot Password**.
2.  Enter your email.
3.  **Check Email**: Click the reset link sent to you.
4.  **New Password**: Set a strong new password (min 8 chars).
5.  *Note*: If SSO is enabled, reset your password with your Identity Provider (e.g., Google).`,

  '137': `# Email Delivery Issues

Emails not arriving?

1.  **Spam Folder**: Check there first.
2.  **Whitelist**: Ask clients to whitelist your domain.
3.  **DKIM/SPF**: Ensure you have verified your domain in **Settings > Domains** if using custom sending.
4.  **Bounced**: Check the Contact profile. If an email bounced, the system pauses sending to that address. Clear the flag to retry.`,

  '138': `# Payment Failure Resolution

Charge failed.

1.  **Retries**: Stripe automatically retries 3 times over 7 days.
2.  **Card Update**: Ask the client to update their card in the Portal.
3.  **Manual**: In **Billing**, click the invoice -> **Charge Card** to manually re-attempt a saved card.`,

  '139': `# Browser Compatibility

Supported platforms.

*   **Chrome**: Latest 2 versions (Recommended).
*   **Safari**: Latest 2 versions.
*   **Firefox**: Latest 2 versions.
*   **Edge**: Latest 2 versions.
*   *IE11 is not supported.*`,

  '140': `# Calendar Sync Errors

Meetings not showing?

1.  **Re-connect**: Go to Settings > Integrations and disconnect/reconnect Google Calendar. Permissions may have expired.
2.  **Check Calendars**: Ensure you selected the correct sub-calendars (e.g., "Work" vs "Family") to sync.
3.  **Cache**: Changes can take up to 5 minutes to reflect due to caching.`,

  '141': `# File Upload Limits

"File Too Large" error.

*   **Max Size**: 50MB per file by default.
*   **Storage Limit**: Check if you have hit your plan's total storage cap (e.g., 10GB).
*   **Solution**: Upgrade plan for more storage, or use a link to Dropbox/Drive for huge files.`,

  '142': `# Missing Notifications

Silence?

1.  **Check Settings**: In Settings > Notifications, ensure toggles are ON.
2.  **Browser Permissions**: Click the lock icon in your URL bar and ensure "Notifications" are allowed for this site.
3.  **Spam**: Check email spam folder for email alerts.`,

  '143': `# Two-Factor Auth Problems

Lost your phone?

1.  **Recovery Codes**: Use one of the 10 backup codes provided when you set up 2FA.
2.  **Admin Reset**: Ask another Admin in your workspace to disable 2FA for your account temporarily.
3.  **Support**: If you are the only Admin, contact \`support@agencyos.io\` with proof of identity.`,

  '144': `# Account Suspension Info

Why is my account locked?

*   **Payment Failed**: Subscription past due > 14 days.
*   **Violation**: Breach of Terms of Service (e.g., spamming).
*   **Action**: Update payment method to restore access instantly. For violations, contact support.`,

  '145': `# Reporting a Bug

Found a glitch?

1.  Click the **Help (?)** icon in the sidebar.
2.  Select **Report Bug**.
3.  **Details**: Describe what happened, what you expected, and include a screenshot if possible.
4.  **Priority**: We review bug reports daily. Critical issues are fixed within 24h.`,

  '146': `# Upgrading/Downgrading Plans

Changing tiers.

1.  Go to **Billing > Plans**.
2.  **Upgrade**: Happens immediately. Prorated charge for the remainder of the month.
3.  **Downgrade**: Takes effect at the end of the current billing cycle. You keep current features until then.`,

  '147': `# Cancelling Subscription

We hate to see you go.

1.  Go to **Billing > Plans**.
2.  Click **Cancel Subscription** at the bottom.
3.  **Effect**: Your account remains active until the end of the paid period. Afterwards, it enters "Read-Only" mode for 30 days before data deletion.`,

  '148': `# Refund Policy

Money back guarantee.

*   **14 Days**: We offer a full refund if you cancel within 14 days of your *first* subscription payment.
*   **Technicals**: Refunds take 5-10 business days to appear on your statement.
*   **Contact**: Email \`billing@agencyos.io\` to request.`,

  '149': `# Adding Extra Seats

Growing team?

1.  Go to **Billing > Add-ons**.
2.  Select **Extra Seats** pack.
3.  **Cost**: Added to your monthly bill.
4.  **Allocation**: Once purchased, go to **Team** to invite new members.`,

  '150': `# Storage Add-ons

Need more space?

1.  Go to **Billing > Add-ons**.
2.  Select **1TB Storage Pack**.
3.  **Activation**: Immediate.
4.  **Note**: Enterprise plans include unlimited storage by default.`,

  '151': `# Changing Agency Name

Rebranding?

1.  Go to **Settings > Agency Identity**.
2.  Update **Agency Name**.
3.  **Update Domain**: If your URL changed, update **Primary Domain**.
4.  **Save**: Updates invoices and portal branding immediately.`,

  '152': `# Deleting Data

Permanent removal.

1.  Go to the specific item (Client, Project, etc.).
2.  Delete it. It moves to **Trash**.
3.  Go to **Settings > Data Management > Empty Trash** to permanently purge.
4.  **Warning**: This cannot be undone.`,

  '153': `# Mobile App Availability

iOS and Android.

*   **PWA**: Install directly from the browser (see article 9).
*   **Native App**: Coming Q4 2024. PWA offers 95% of functionality today, including push notifications on Android (and iOS 16.4+).`,

  '154': `# Contacting Priority Support

Fast lane access.

*   **Enterprise**: You have a dedicated Slack channel and Account Manager.
*   **Pro**: 4h email response time.
*   **Starter/Free**: 24-48h email response time.
*   **Email**: \`support@agencyos.io\`.`,

  '155': `# System Status Page

Is it down?

*   **Check**: \`status.agencyos.io\`
*   **Uptime**: We maintain 99.99% uptime.
*   **Maintenance**: Scheduled maintenance is announced 48h in advance via dashboard banner.`,

  '156': `# Supported Languages

Localization.

*   **Interface**: Currently English only.
*   **Client Portal**: Supports English, Spanish, French, German (Auto-detected based on client browser).
*   **Invoices**: Labels can be customized to any language in **Invoice Settings**.`,
};

// --- ARTICLE CONTENT GENERATOR (Fallback for 101+) ---
// The content is now directly in DETAILED_ARTICLES, so this is just a backup or for dynamic parts
const generateArticleContent = (id: string, title: string, category: string) => {
  if (DETAILED_ARTICLES[id]) {
      return DETAILED_ARTICLES[id];
  }
  return `# ${title}\n\nContent coming soon...`;
};

const ARTICLES = [
  // --- GETTING STARTED (10) ---
  { id: '1', title: 'Zify AI Quick Start Guide', category: 'Getting Started', reads: '12.5k', time: '5 min' },
  { id: '2', title: 'Configuring your Agency Identity', category: 'Getting Started', reads: '8.2k', time: '3 min' },
  { id: '3', title: 'Setting up your first Workspace', category: 'Getting Started', reads: '5.4k', time: '4 min' },
  { id: '4', title: 'Inviting Team Members & Roles', category: 'Getting Started', reads: '6.1k', time: '4 min' },
  { id: '5', title: 'Understanding the Command Center', category: 'Getting Started', reads: '9.3k', time: '6 min' },
  { id: '6', title: 'Importing Data from Legacy Systems', category: 'Getting Started', reads: '3.2k', time: '8 min' },
  { id: '7', title: 'Setting up Global Currency & Tax', category: 'Getting Started', reads: '4.5k', time: '3 min' },
  { id: '8', title: 'Navigating the Sidebar Interface', category: 'Getting Started', reads: '2.1k', time: '2 min' },
  { id: '9', title: 'Mobile App Configuration', category: 'Getting Started', reads: '1.8k', time: '4 min' },
  { id: '10', title: 'Security Best Practices for Agencies', category: 'Getting Started', reads: '2.9k', time: '5 min' },

  // --- CLIENTS & CRM (15) ---
  { id: '11', title: 'Adding Client Profiles to Registry', category: 'Clients', reads: '3.4k', time: '3 min' },
  { id: '12', title: 'Managing Client Status (Lead vs Active)', category: 'Clients', reads: '2.8k', time: '2 min' },
  { id: '13', title: 'Setting up Client Portal Access', category: 'Clients', reads: '4.1k', time: '5 min' },
  { id: '14', title: 'Customizing Onboarding Flows', category: 'Clients', reads: '1.9k', time: '6 min' },
  { id: '15', title: 'Tracking Client LTV & Revenue', category: 'Clients', reads: '2.2k', time: '4 min' },
  { id: '16', title: 'Pipeline Management Strategies', category: 'CRM', reads: '3.5k', time: '5 min' },
  { id: '17', title: 'Configuring Deal Stages', category: 'CRM', reads: '1.7k', time: '3 min' },
  { id: '18', title: 'Lead Scoring & Probability', category: 'CRM', reads: '2.4k', time: '4 min' },
  { id: '19', title: 'Automated Follow-up Protocols', category: 'CRM', reads: '1.5k', time: '5 min' },
  { id: '20', title: 'Exporting CRM Data to CSV', category: 'CRM', reads: '900', time: '2 min' },
  { id: '21', title: 'Syncing Email Contacts', category: 'CRM', reads: '1.2k', time: '3 min' },
  { id: '22', title: 'Managing Multiple Stakeholders', category: 'Clients', reads: '1.1k', time: '3 min' },
  { id: '23', title: 'Client Retention Reporting', category: 'Clients', reads: '2.6k', time: '4 min' },
  { id: '24', title: 'Archiving Inactive Accounts', category: 'Clients', reads: '850', time: '2 min' },
  { id: '25', title: 'Client Tagging Taxonomy', category: 'CRM', reads: '1.4k', time: '3 min' },

  // --- PROJECTS & MISSIONS (15) ---
  { id: '26', title: 'Creating a New Mission Request', category: 'Projects', reads: '5.2k', time: '3 min' },
  { id: '27', title: 'Assigning Team Members to Tasks', category: 'Projects', reads: '4.8k', time: '2 min' },
  { id: '28', title: 'Setting Priority & Risk Levels', category: 'Projects', reads: '2.1k', time: '3 min' },
  { id: '29', title: 'Understanding Credit Consumption', category: 'Projects', reads: '3.9k', time: '4 min' },
  { id: '30', title: 'File Asset Management in Missions', category: 'Projects', reads: '1.6k', time: '3 min' },
  { id: '31', title: 'Using the Checklist System', category: 'Projects', reads: '2.2k', time: '2 min' },
  { id: '32', title: 'Duplicating Mission Blueprints', category: 'Projects', reads: '1.1k', time: '2 min' },
  { id: '33', title: 'Kanban vs List View Workflows', category: 'Projects', reads: '2.5k', time: '4 min' },
  { id: '34', title: 'Filtering Missions by Status', category: 'Projects', reads: '1.8k', time: '2 min' },
  { id: '35', title: 'Archiving Completed Projects', category: 'Projects', reads: '950', time: '2 min' },
  { id: '36', title: 'Collaborating via Comments', category: 'Projects', reads: '1.3k', time: '3 min' },
  { id: '37', title: 'Setting Strategic Deadlines', category: 'Projects', reads: '1.5k', time: '3 min' },
  { id: '38', title: 'Linking Projects to Invoices', category: 'Projects', reads: '1.9k', time: '4 min' },
  { id: '39', title: 'Managing Scope Creep', category: 'Projects', reads: '2.7k', time: '5 min' },
  { id: '40', title: 'Project Health Monitoring', category: 'Projects', reads: '1.4k', time: '4 min' },

  // --- FINANCE & BILLING (20) ---
  { id: '41', title: 'Creating Your First Invoice', category: 'Finance', reads: '6.5k', time: '4 min' },
  { id: '42', title: 'Setting Up Recurring Retainers', category: 'Finance', reads: '4.2k', time: '5 min' },
  { id: '43', title: 'Configuring Stripe Integration', category: 'Finance', reads: '3.8k', time: '6 min' },
  { id: '44', title: 'Managing Tax Rates & VAT', category: 'Finance', reads: '2.9k', time: '4 min' },
  { id: '45', title: 'Sending Estimates & Proposals', category: 'Finance', reads: '3.1k', time: '4 min' },
  { id: '46', title: 'Converting Estimates to Invoices', category: 'Finance', reads: '2.5k', time: '2 min' },
  { id: '47', title: 'Customizing Invoice Branding', category: 'Finance', reads: '1.8k', time: '3 min' },
  { id: '48', title: 'Tracking Overdue Payments', category: 'Finance', reads: '2.2k', time: '3 min' },
  { id: '49', title: 'Automated Payment Reminders', category: 'Finance', reads: '3.4k', time: '4 min' },
  { id: '50', title: 'Handling Multi-Currency Clients', category: 'Finance', reads: '1.6k', time: '5 min' },
  { id: '51', title: 'Exporting Financial Reports', category: 'Finance', reads: '2.1k', time: '3 min' },
  { id: '52', title: 'Understanding Agency Credit System', category: 'Finance', reads: '1.9k', time: '5 min' },
  { id: '53', title: 'Purchasing Additional Credits', category: 'Finance', reads: '1.2k', time: '2 min' },
  { id: '54', title: 'Managing Agency Subscription', category: 'Finance', reads: '1.5k', time: '3 min' },
  { id: '55', title: 'Applying Discounts & Coupons', category: 'Finance', reads: '1.1k', time: '2 min' },
  { id: '56', title: 'Setting Invoice Prefixes', category: 'Finance', reads: '900', time: '2 min' },
  { id: '57', title: 'Viewing Transaction History', category: 'Finance', reads: '1.3k', time: '2 min' },
  { id: '58', title: 'Processing Refunds', category: 'Finance', reads: '750', time: '3 min' },
  { id: '59', title: 'Late Fee Configuration', category: 'Finance', reads: '1.4k', time: '3 min' },
  { id: '60', title: 'Secure Payment Links', category: 'Finance', reads: '2.8k', time: '4 min' },

  // --- AI & AUTOMATION (20) ---
  { id: '61', title: 'Introduction to Zify AI', category: 'AI', reads: '7.8k', time: '5 min' },
  { id: '62', title: 'Using Strategic Mode for Planning', category: 'AI', reads: '4.5k', time: '4 min' },
  { id: '63', title: 'Generating Creative Briefs', category: 'AI', reads: '3.9k', time: '3 min' },
  { id: '64', title: 'Analyzing Images with Multimodal AI', category: 'AI', reads: '2.7k', time: '4 min' },
  { id: '65', title: 'Configuring AI Creativity Temperature', category: 'AI', reads: '1.5k', time: '3 min' },
  { id: '66', title: 'Exporting AI Intel Reports', category: 'AI', reads: '1.2k', time: '2 min' },
  { id: '67', title: 'Building Automation Workflows', category: 'Automation', reads: '5.1k', time: '8 min' },
  { id: '68', title: 'Understanding Triggers & Actions', category: 'Automation', reads: '4.2k', time: '6 min' },
  { id: '69', title: 'Setting Up Email Autoresponders', category: 'Automation', reads: '3.6k', time: '5 min' },
  { id: '70', title: 'Automating Task Assignment', category: 'Automation', reads: '2.9k', time: '4 min' },
  { id: '71', title: 'Conditional Logic in Workflows', category: 'Automation', reads: '2.4k', time: '7 min' },
  { id: '72', title: 'Webhook Integrations', category: 'Automation', reads: '1.8k', time: '6 min' },
  { id: '73', title: 'Testing & Debugging Workflows', category: 'Automation', reads: '1.5k', time: '5 min' },
  { id: '74', title: 'AI Grounding with Web Search', category: 'AI', reads: '2.1k', time: '3 min' },
  { id: '75', title: 'Using AI for Contract Generation', category: 'AI', reads: '1.9k', time: '4 min' },
  { id: '76', title: 'Automated Invoice Follow-ups', category: 'Automation', reads: '2.5k', time: '3 min' },
  { id: '77', title: 'Lead Scoring Automation', category: 'Automation', reads: '1.7k', time: '5 min' },
  { id: '78', title: 'AI Prompt Engineering Guide', category: 'AI', reads: '3.2k', time: '6 min' },
  { id: '79', title: 'Data Privacy in AI Processing', category: 'AI', reads: '1.4k', time: '4 min' },
  { id: '80', title: 'Optimizing Workflow Latency', category: 'Automation', reads: '800', time: '4 min' },

  // --- MARKETING SUITE (20) ---
  { id: '81', title: 'Creating Email Marketing Campaigns', category: 'Marketing', reads: '4.8k', time: '6 min' },
  { id: '82', title: 'Designing Email Templates', category: 'Marketing', reads: '3.5k', time: '5 min' },
  { id: '83', title: 'Managing Audience Segments', category: 'Marketing', reads: '2.9k', time: '4 min' },
  { id: '84', title: 'A/B Testing Subject Lines', category: 'Marketing', reads: '2.2k', time: '4 min' },
  { id: '85', title: 'Analyzing Campaign Performance', category: 'Marketing', reads: '3.1k', time: '5 min' },
  { id: '86', title: 'Setting Up Custom Domains', category: 'Marketing', reads: '1.8k', time: '6 min' },
  { id: '87', title: 'Configuring Sender Identity', category: 'Marketing', reads: '1.5k', time: '3 min' },
  { id: '88', title: 'Importing Contacts for Marketing', category: 'Marketing', reads: '2.4k', time: '3 min' },
  { id: '89', title: 'Using Dynamic Content Blocks', category: 'Marketing', reads: '1.9k', time: '5 min' },
  { id: '90', title: 'Multi-Armed Bandit Optimization', category: 'Marketing', reads: '1.2k', time: '7 min' },
  { id: '91', title: 'Conversion Funnel Tracking', category: 'Marketing', reads: '2.6k', time: '5 min' },
  { id: '92', title: 'Omnichannel Strategy Guide', category: 'Marketing', reads: '1.7k', time: '4 min' },
  { id: '93', title: 'Scheduling Broadcasts', category: 'Marketing', reads: '1.3k', time: '2 min' },
  { id: '94', title: 'Understanding Open & Click Rates', category: 'Marketing', reads: '2.8k', time: '4 min' },
  { id: '95', title: 'Managing Unsubscribes & Bounces', category: 'Marketing', reads: '1.1k', time: '3 min' },
  { id: '96', title: 'Integrating with Social Media', category: 'Marketing', reads: '1.5k', time: '4 min' },
  { id: '97', title: 'Using AI to Write Copy', category: 'Marketing', reads: '2.3k', time: '3 min' },
  { id: '98', title: 'Creating Landing Pages', category: 'Marketing', reads: '3.4k', time: '6 min' },
  { id: '99', title: 'SEO Optimization Basics', category: 'Marketing', reads: '2.1k', time: '5 min' },
  { id: '100', title: 'Direct Mail Broadcasts', category: 'Marketing', reads: '900', time: '3 min' },

  // --- OPERATIONS & PRODUCTIVITY (20) ---
  { id: '101', title: 'Using the Time Tracker', category: 'Productivity', reads: '3.2k', time: '3 min' },
  { id: '102', title: 'Logging Manual Time Entries', category: 'Productivity', reads: '1.8k', time: '2 min' },
  { id: '103', title: 'Reviewing Team Utilization', category: 'Productivity', reads: '2.4k', time: '4 min' },
  { id: '104', title: 'Billable vs Non-Billable Hours', category: 'Productivity', reads: '2.1k', time: '3 min' },
  { id: '105', title: 'Configuring Booking Pages', category: 'Scheduling', reads: '3.5k', time: '5 min' },
  { id: '106', title: 'Syncing Google Calendar', category: 'Scheduling', reads: '2.9k', time: '4 min' },
  { id: '107', title: 'Setting Availability Windows', category: 'Scheduling', reads: '1.7k', time: '3 min' },
  { id: '108', title: 'Creating Booking Event Types', category: 'Scheduling', reads: '1.5k', time: '4 min' },
  { id: '109', title: 'Embedding Bookings on Website', category: 'Scheduling', reads: '1.2k', time: '5 min' },
  { id: '110', title: 'Managing Support Tickets', category: 'Operations', reads: '2.3k', time: '4 min' },
  { id: '111', title: 'Ticket SLA & Priority Rules', category: 'Operations', reads: '1.4k', time: '5 min' },
  { id: '112', title: 'File Storage & Organization', category: 'Operations', reads: '2.6k', time: '3 min' },
  { id: '113', title: 'Sharing Files Securely', category: 'Operations', reads: '1.8k', time: '2 min' },
  { id: '114', title: 'Using Internal Wiki Pages', category: 'Operations', reads: '1.5k', time: '4 min' },
  { id: '115', title: 'Activity Log Auditing', category: 'Operations', reads: '1.1k', time: '3 min' },
  { id: '116', title: 'Managing App Notifications', category: 'Operations', reads: '1.3k', time: '2 min' },
  { id: '117', title: 'Exporting Time Reports', category: 'Productivity', reads: '950', time: '2 min' },
  { id: '118', title: 'Handling Meeting Conflicts', category: 'Scheduling', reads: '800', time: '3 min' },
  { id: '119', title: 'Setting Up Custom Services', category: 'Operations', reads: '2.2k', time: '4 min' },
  { id: '120', title: 'Service Pricing Strategies', category: 'Operations', reads: '1.6k', time: '5 min' },

  // --- ADVANCED & DEVELOPER (15) ---
  { id: '121', title: 'Zify AI API Overview', category: 'Developer', reads: '1.5k', time: '6 min' },
  { id: '122', title: 'Authentication & Tokens', category: 'Developer', reads: '1.2k', time: '5 min' },
  { id: '123', title: 'Webhooks Configuration', category: 'Developer', reads: '1.1k', time: '5 min' },
  { id: '124', title: 'Custom Domain DNS Setup', category: 'Developer', reads: '2.3k', time: '7 min' },
  { id: '125', title: 'Rate Limiting & Quotas', category: 'Developer', reads: '900', time: '4 min' },
  { id: '126', title: 'Error Handling Best Practices', category: 'Developer', reads: '800', time: '5 min' },
  { id: '127', title: 'Integrating with Zapier', category: 'Developer', reads: '3.1k', time: '4 min' },
  { id: '128', title: 'SSO Configuration (Enterprise)', category: 'Developer', reads: '1.4k', time: '6 min' },
  { id: '129', title: 'Data Export API', category: 'Developer', reads: '750', time: '4 min' },
  { id: '130', title: 'White-Labeling the Portal', category: 'Advanced', reads: '1.9k', time: '5 min' },
  { id: '131', title: 'GDPR & Compliance Features', category: 'Advanced', reads: '2.1k', time: '6 min' },
  { id: '132', title: 'Managing Multi-Org Accounts', category: 'Advanced', reads: '600', time: '4 min' },
  { id: '133', title: 'Role-Based Access Control (RBAC)', category: 'Advanced', reads: '1.3k', time: '5 min' },
  { id: '134', title: 'Customizing Email SMTP', category: 'Advanced', reads: '1.1k', time: '5 min' },
  { id: '135', title: 'Audit Trail Export', category: 'Advanced', reads: '500', time: '3 min' },

  // --- TROUBLESHOOTING & FAQ (21) ---
  { id: '136', title: 'Resetting Your Password', category: 'Troubleshooting', reads: '5.4k', time: '2 min' },
  { id: '137', title: 'Email Delivery Issues', category: 'Troubleshooting', reads: '2.8k', time: '4 min' },
  { id: '138', title: 'Payment Failure Resolution', category: 'Troubleshooting', reads: '1.9k', time: '3 min' },
  { id: '139', title: 'Browser Compatibility', category: 'Troubleshooting', reads: '1.2k', time: '2 min' },
  { id: '140', title: 'Calendar Sync Errors', category: 'Troubleshooting', reads: '1.5k', time: '3 min' },
  { id: '141', title: 'File Upload Limits', category: 'Troubleshooting', reads: '1.8k', time: '2 min' },
  { id: '142', title: 'Missing Notifications', category: 'Troubleshooting', reads: '1.4k', time: '3 min' },
  { id: '143', title: 'Two-Factor Auth Problems', category: 'Troubleshooting', reads: '1.1k', time: '4 min' },
  { id: '144', title: 'Account Suspension Info', category: 'Troubleshooting', reads: '600', time: '3 min' },
  { id: '145', title: 'Reporting a Bug', category: 'Troubleshooting', reads: '900', time: '2 min' },
  { id: '146', title: 'Upgrading/Downgrading Plans', category: 'FAQ', reads: '3.2k', time: '3 min' },
  { id: '147', title: 'Cancelling Subscription', category: 'FAQ', reads: '1.5k', time: '2 min' },
  { id: '148', title: 'Refund Policy', category: 'FAQ', reads: '2.1k', time: '3 min' },
  { id: '149', title: 'Adding Extra Seats', category: 'FAQ', reads: '1.8k', time: '2 min' },
  { id: '150', title: 'Storage Add-ons', category: 'FAQ', reads: '1.3k', time: '2 min' },
  { id: '151', title: 'Changing Agency Name', category: 'FAQ', reads: '1.1k', time: '2 min' },
  { id: '152', title: 'Deleting Data', category: 'FAQ', reads: '800', time: '3 min' },
  { id: '153', title: 'Mobile App Availability', category: 'FAQ', reads: '2.5k', time: '2 min' },
  { id: '154', title: 'Contacting Priority Support', category: 'FAQ', reads: '1.6k', time: '2 min' },
  { id: '155', title: 'System Status Page', category: 'FAQ', reads: '900', time: '1 min' },
  { id: '156', title: 'Supported Languages', category: 'FAQ', reads: '700', time: '2 min' }
].map(article => ({
  ...article,
  content: generateArticleContent(article.id, article.title, article.category)
}));

// Replaced static VIDEOS with state-based system
const DEFAULT_VIDEOS: VideoTutorial[] = [];

const FAQS = [
  { question: 'How do I reset my API key?', answer: 'Navigate to Settings > Developer Settings. You can regenerate your key there. Note that the old key will stop working immediately.' },
  { question: 'Can I add multiple organizations?', answer: 'Yes, Enterprise plans support multi-org tenancy. Contact sales to enable this feature on your account.' },
  { question: 'What payment methods are accepted?', answer: 'We accept all major credit cards (Visa, Mastercard, Amex) and ACH transfers for annual contracts.' },
  { question: 'Is my data encrypted?', answer: 'Absolutely. We use AES-256 encryption at rest and TLS 1.3 for all data in transit.' },
];

const RECENT_TICKETS = [
  { id: 'TKT-9921', subject: 'Integration Failure', status: 'In Progress', date: '2 hours ago' },
  { id: 'TKT-9904', subject: 'Billing Inquiry', status: 'Resolved', date: 'Yesterday' },
];

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface VideoTutorial {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
}

// --- ARTICLE READER MODAL ---
const ArticleReader = ({ article, onClose, onToast, isBookmarked, onToggleBookmark }: { article: typeof ARTICLES[0], onClose: () => void, onToast: (msg: string) => void, isBookmarked: boolean, onToggleBookmark: () => void }) => {
  const VOTE_KEY = 'agencyos_votes';
  const [vote, setVote] = useState<'yes' | 'no' | null>(null);
  const [showFeedbackSuccess, setShowFeedbackSuccess] = useState(false);

  useEffect(() => {
    const votes = JSON.parse(localStorage.getItem(VOTE_KEY) || '{}');
    setVote(votes[article.id] || null);
  }, [article.id]);

  const handleVote = (type: 'yes' | 'no') => {
     const votes = JSON.parse(localStorage.getItem(VOTE_KEY) || '{}');
     votes[article.id] = type;
     localStorage.setItem(VOTE_KEY, JSON.stringify(votes));
     setVote(type);
     setShowFeedbackSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-[10005] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-article-content, #printable-article-content * {
            visibility: visible;
          }
          #printable-article-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: visible;
            background: white;
            color: black;
          }
          /* Hide scrollbars and UI elements in print */
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="fixed inset-0" onClick={onClose} />
      <div id="printable-article-content" className="relative bg-white dark:bg-zinc-900 w-full max-w-4xl h-[85vh] rounded-[3rem] shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex items-start justify-between bg-white dark:bg-zinc-900 sticky top-0 z-10">
           <div className="space-y-4">
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-900/30">
                 {article.category}
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight max-w-2xl">
                 {article.title}
              </h2>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400 dark:text-zinc-500">
                 <span className="flex items-center gap-1"><Clock size={14}/> {article.time} Read</span>
                 <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
                 <span className="flex items-center gap-1"><Eye size={14}/> {article.reads} Views</span>
              </div>
           </div>
           
           <div className="flex gap-2 no-print">
              <button onClick={onToggleBookmark} className={`p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all ${isBookmarked ? 'text-blue-600' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                  <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
              </button>
              <button onClick={onClose} className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all ml-2"><X size={20}/></button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 md:p-14 bg-slate-50/50 dark:bg-black/20">
           <div className="max-w-2xl mx-auto prose prose-slate dark:prose-invert prose-headings:font-black prose-p:font-medium prose-p:leading-relaxed prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-[2rem] prose-img:shadow-xl prose-hr:border-slate-200 dark:prose-hr:border-zinc-800">
               <FormattedText text={article.content} role="bot" />
           </div>

           {/* Feedback */}
           <div className="max-w-2xl mx-auto mt-16 pt-10 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center no-print min-h-[60px]">
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-500">Was this article helpful?</p>
              
              {showFeedbackSuccess ? (
                  <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                          <CheckCircle2 size={16} />
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">Thanks for your feedback!</span>
                  </div>
              ) : (
                  <div className="flex gap-3">
                     <button 
                        onClick={() => handleVote('yes')}
                        className={`px-6 py-2 border rounded-xl text-xs font-bold transition-all shadow-sm ${vote === 'yes' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-blue-500 hover:text-blue-600'}`}
                     >
                        Yes
                     </button>
                     <button 
                        onClick={() => handleVote('no')}
                        className={`px-6 py-2 border rounded-xl text-xs font-bold transition-all shadow-sm ${vote === 'no' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-500 text-rose-600' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-rose-500 hover:text-rose-600'}`}
                     >
                        No
                     </button>
                  </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

const FormattedText = ({ text, role }: { text: string, role: 'user' | 'bot' }) => {
  const isUser = role === 'user';
  const textColorClass = isUser ? 'text-white' : 'text-slate-700 dark:text-zinc-300';
  const headerColorClass = isUser ? 'text-white' : 'text-slate-900 dark:text-white';
  const strongColorClass = isUser ? 'text-white' : 'text-slate-900 dark:text-white';

  const parseInline = (inputText: string) => {
    // Basic Markdown Parsing: Bold, Italic, Code
    const parts = inputText.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className={`font-black ${strongColorClass}`}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className={`px-1.5 py-0.5 rounded text-xs font-mono ${isUser ? 'bg-white/20' : 'bg-slate-100 dark:bg-zinc-700'}`}>{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const lines = text.split('\n');
  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i}/>;
        
        if (line.startsWith('### ')) {
          return <h4 key={i} className={`text-lg font-black mt-6 mb-2 ${headerColorClass}`}>{line.replace('### ', '')}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={i} className={`text-xl font-black mt-8 mb-4 ${headerColorClass}`}>{line.replace('## ', '')}</h3>;
        }
        if (line.startsWith('# ')) {
          return <h2 key={i} className={`text-2xl font-black mt-10 mb-6 ${headerColorClass}`}>{line.replace('# ', '')}</h2>;
        }
        
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          return (
            <div key={i} className="flex items-start gap-3 ml-4">
              <div className={`w-1.5 h-1.5 rounded-full mt-2.5 shrink-0 ${isUser ? 'bg-white' : 'bg-blue-500'}`} />
              <span className={`${textColorClass} font-medium leading-relaxed`}>{parseInline(line.replace(/^(\*|-)\s*/, ''))}</span>
            </div>
          );
        }

        if (/^\d+\.\s/.test(line.trim())) {
          return (
            <div key={i} className="flex items-start gap-3 ml-4">
              <span className={`${isUser ? 'text-white' : 'text-blue-600 dark:text-blue-400'} font-black text-sm mt-0.5 shrink-0`}>{line.trim().split('.')[0]}.</span>
              <span className={`${textColorClass} font-medium leading-relaxed`}>{parseInline(line.replace(/^\d+\.\s*/, ''))}</span>
            </div>
          );
        }

        if (line.startsWith('> ')) {
            return (
                <div key={i} className="pl-6 border-l-4 border-blue-500 my-6 italic text-slate-600 dark:text-zinc-400">
                    {parseInline(line.replace('> ', ''))}
                </div>
            )
        }

        return <p key={i} className={`leading-relaxed ${textColorClass}`}>{parseInline(line)}</p>;
      })}
    </div>
  );
};

const Help: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Knowledge' | 'Chat'>('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<typeof ARTICLES[0] | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('agencyos_bookmarks') || '[]');
    } catch { return []; }
  });
  
  // Hero Animation Ref
  const heroRef = useRef<HTMLDivElement>(null);

  // Video Management State (Backend Simulation)
  const [videos, setVideos] = useState<VideoTutorial[]>(() => {
    const saved = localStorage.getItem('agencyos_tutorials_db');
    return saved ? JSON.parse(saved) : DEFAULT_VIDEOS;
  });

  // Chat State with Persistence
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('agencyos_support_chat');
    if (saved) {
      try {
        return JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [{ id: '1', text: 'Hello! I am Zify AI. I have full access to the documentation. How can I help you scale your business today?', sender: 'bot', timestamp: new Date() }];
  });
  
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ticket Form State
  const [toast, setToast] = useState<string | null>(null);

  // Persist chat whenever it changes
  useEffect(() => {
    localStorage.setItem('agencyos_support_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Persist videos whenever changed
  useEffect(() => {
    localStorage.setItem('agencyos_tutorials_db', JSON.stringify(videos));
  }, [videos]);

  useEffect(() => {
    if (chatEndRef.current && activeTab === 'Chat') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab, isTyping]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Hero Hover Animation Handlers
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation (sway) - max 4 degrees
    const rotateX = ((y - centerY) / centerY) * -4; 
    const rotateY = ((x - centerX) / centerX) * 4;

    // Calculate translation (slight move)
    const translateX = (x - centerX) / 50;
    const translateY = (y - centerY) / 50;

    heroRef.current.style.setProperty('--rx', `${rotateX}deg`);
    heroRef.current.style.setProperty('--ry', `${rotateY}deg`);
    heroRef.current.style.setProperty('--tx', `${translateX}px`);
    heroRef.current.style.setProperty('--ty', `${translateY}px`);
  };

  const handleHeroMouseLeave = () => {
    if (!heroRef.current) return;
    heroRef.current.style.setProperty('--rx', `0deg`);
    heroRef.current.style.setProperty('--ry', `0deg`);
    heroRef.current.style.setProperty('--tx', `0px`);
    heroRef.current.style.setProperty('--ty', `0px`);
  };

  const handleSendMessage = async (e?: React.FormEvent, textOverride?: string) => {
    e?.preventDefault();
    const textToSend = textOverride || chatInput;
    if (!textToSend.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
    setIsTyping(true);

    // Reset height of textarea
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }

    try {
      const liveContext = getLiveSystemState();

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: textToSend,
        config: {
          systemInstruction: `You are the Zify AI Support Bot. 
          Your goal is to help the user navigate and troubleshoot the AgencyOS platform.
          
          You have access to the user's current live data:
          ${liveContext}

          You also have access to the UI Navigation Map:
          ${UI_NAVIGATION_MAP}

          RESTRICTIONS:
          1. You must ONLY answer questions related to AgencyOS, its features, or the user's data.
          2. If the user asks about anything unrelated (e.g., "What is the capital of France?", "Write a poem about dogs"), politely refuse.
          3. When referencing UI elements, use the exact locations described in the UI Navigation Map.
          4. When referencing data (e.g., invoice #), be precise based on the provided live context.

          TONE: Professional, concise, technical, helpful.`,
        }
      });
      
      const botReply = response.text || "I'm having trouble retrieving that information right now.";

      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: botReply,
        sender: 'bot',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error("Support Bot Error:", error);
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm unable to connect to the knowledge base at this moment. Please check your connection or try again later.",
        sender: 'bot',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    if(window.confirm("Clear conversation history?")) {
        setChatMessages([{ id: Date.now().toString(), text: 'Conversation reset. How can I help you?', sender: 'bot', timestamp: new Date() }]);
        setIsMenuOpen(false);
    }
  };

  const handleDownloadChat = () => {
    const text = chatMessages.map(m => `[${m.timestamp.toLocaleString()}] ${m.sender.toUpperCase()}: ${m.text}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `support-chat-${new Date().toISOString()}.txt`;
    a.click();
    setIsMenuOpen(false);
  };

  const handleDeleteVideo = (id: string) => {
    if (window.confirm("Permanently delete this tutorial from the database?")) {
      setVideos(prev => prev.filter(v => v.id !== id));
      showToast("Tutorial Removed");
    }
  };

  const handleToggleBookmark = (id: string) => {
    let newBookmarks;
    if (bookmarks.includes(id)) {
      newBookmarks = bookmarks.filter(bid => bid !== id);
      showToast("Article removed from knowledge base top");
    } else {
      newBookmarks = [...bookmarks, id];
      showToast("Article pinned to top");
    }
    setBookmarks(newBookmarks);
    localStorage.setItem('agencyos_bookmarks', JSON.stringify(newBookmarks));
  };

  // Text Formatting Helpers
  const insertFormat = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = chatInput;
    const selection = text.substring(start, end);
    
    const newText = text.substring(0, start) + before + selection + after + text.substring(end);
    setChatInput(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const filteredArticles = useMemo(() => {
    const list = ARTICLES.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return list.sort((a, b) => {
        const aPinned = bookmarks.includes(a.id);
        const bPinned = bookmarks.includes(b.id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
    });
  }, [searchQuery, bookmarks]);

  const NavButton = ({ tab, icon: Icon, label }: { tab: any, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full px-5 py-3.5 rounded-2xl text-left text-xs font-black transition-all flex items-center gap-3 group relative overflow-hidden ${
        activeTab === tab 
        ? 'bg-slate-900 dark:bg-zinc-800 text-white shadow-lg shadow-blue-500/5' 
        : 'text-slate-500 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <Icon size={18} className={`relative z-10 transition-colors ${activeTab === tab ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-zinc-600 dark:group-hover:text-zinc-300'}`} />
      <span className="relative z-10 uppercase tracking-widest">{label}</span>
      {activeTab === tab && <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />}
    </button>
  );

  const RECENT_TICKETS = [
          { id: 'TKT-9921', subject: 'Integration Failure', status: 'In Progress', date: '2 hours ago' },
          { id: 'TKT-9904', subject: 'Billing Inquiry', status: 'Resolved', date: 'Yesterday' },
        ];

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-24 relative">
      <style>{`
        @keyframes flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-flow {
          animation: flow 3s linear infinite;
          background-size: 200% 200%;
        }
      `}</style>
      
      {/* Article Reader Modal */}
      {selectedArticle && (
        <ArticleReader 
          article={selectedArticle} 
          onClose={() => setSelectedArticle(null)} 
          onToast={showToast}
          isBookmarked={bookmarks.includes(selectedArticle.id)}
          onToggleBookmark={() => handleToggleBookmark(selectedArticle.id)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[10002] bg-slate-900 dark:bg-zinc-800 text-white px-8 py-4 rounded-[2rem] font-black text-sm shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-3 border border-white/10">
          <CheckCircle2 size={18} className="text-emerald-400" />
          {toast}
        </div>
      )}

      {/* Hero Header with Mouse Sensitive Sway */}
      <div 
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative bg-black rounded-[3rem] min-h-[400px] flex flex-col justify-center items-center px-8 py-20 overflow-hidden mb-12 border border-zinc-800 shadow-2xl isolate"
        style={{ perspective: '1200px' }}
      >
        {/* Grid Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
        
        {/* Swaying Content Wrapper */}
        <div 
          className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto w-full transition-transform duration-200 ease-out will-change-transform"
          style={{ transform: 'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translate3d(var(--tx, 0px), var(--ty, 0px), 0)' }}
        >
           
           {/* Title */}
           <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[1.1] mb-10 drop-shadow-2xl">
              How can we accelerate your <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 animate-gradient-x">workflow?</span>
           </h1>

           {/* Search Bar with Flowing Animation */}
           <div className="w-full max-w-2xl relative group">
              <div className="absolute -inset-[3px] bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-[2rem] blur-md opacity-30 group-hover:opacity-100 transition-all duration-700 animate-flow" />
              <div className="relative flex items-center bg-zinc-900 border border-zinc-800 focus-within:border-zinc-700 focus-within:ring-4 focus-within:ring-zinc-800 rounded-[2rem] p-2 transition-all shadow-2xl">
                 <Search className="ml-5 text-zinc-500 shrink-0" size={22} />
                 <input 
                    type="text" 
                    placeholder="Search guides, API docs, or troubleshooting..." 
                    className="w-full bg-transparent border-none outline-none text-white placeholder:text-zinc-600 px-4 py-4 text-sm font-bold tracking-tight"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value && activeTab !== 'Knowledge') setActiveTab('Knowledge');
                    }}
                 />
                 <div className="hidden md:flex items-center gap-2 pr-4 text-zinc-600">
                    <span className="px-2.5 py-1.5 bg-black rounded-lg text-[10px] font-black border border-zinc-800">CMD+K</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3 space-y-6 sticky top-6">
          <div className="bg-white dark:bg-zinc-900 p-3 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="mt-2 space-y-1">
              <NavButton tab="Overview" icon={LayoutGrid} label="Command Center" />
              <NavButton tab="Knowledge" icon={Book} label="Knowledge Base" />
              <NavButton tab="Chat" icon={MessageCircle} label="Live Support" />
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group border border-slate-800 dark:border-zinc-800">
            <div className="absolute right-[-20%] top-[-20%] opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <Zap size={140} />
            </div>
            <div className="flex items-center justify-between mb-6 relative z-10">
               <p className="text-[10px] font-black uppercase tracking-widest opacity-60">System Status</p>
               <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
            </div>
            <h4 className="text-xl font-black mb-4">All Systems Operational</h4>
            
            <div className="space-y-3 relative z-10">
               <div className="flex items-center justify-between text-[10px] font-bold opacity-80">
                  <span>API Latency</span>
                  <span className="text-emerald-400">24ms</span>
               </div>
               <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 w-[92%] h-full rounded-full" />
               </div>
               <div className="flex items-center justify-between text-[10px] font-bold opacity-80 pt-2">
                  <span>Database</span>
                  <span className="text-emerald-400">Healthy</span>
               </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white shadow-2xl group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700 rotate-12">
               <Users size={100} />
            </div>
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/10 shadow-inner">
                     <MessageCircle size={20} className="text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-2 py-1 rounded border border-white/10">Community</span>
               </div>
               <h4 className="text-xl font-black mb-2 leading-tight">Join 1,000+ Agency Owners</h4>
               <p className="text-xs font-medium text-indigo-100 mb-6 leading-relaxed opacity-90">
                  Share strategies, get feedback, and grow together in our exclusive collective.
               </p>
               <a 
                 href="https://whop.com/agencify/"
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="w-full py-4 bg-white text-indigo-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all shadow-lg active:scale-95"
               >
                  Join Server <ExternalLink size={12} />
               </a>
            </div>
          </div>

        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-8">
          
          {activeTab === 'Overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: 'Start Chat', desc: 'Average wait: 2m', icon: MessageCircle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', action: () => setActiveTab('Chat') },
                  { title: 'Browse Guides', desc: '150+ articles', icon: Book, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', action: () => setActiveTab('Knowledge') },
                ].map((card, i) => (
                  <button 
                    key={i} 
                    onClick={card.action}
                    className="p-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] text-left hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200 dark:hover:border-blue-800 transition-all group hover:-translate-y-1 relative overflow-hidden"
                  >
                    <div className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm`}>
                      <card.icon size={28} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">{card.title}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-500">{card.desc}</p>
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                       <ArrowRight size={20} className="text-slate-300 dark:text-zinc-600" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 p-10 shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8">Frequently Asked</h3>
                  <div className="space-y-4">
                    {FAQS.map((faq, idx) => (
                      <div key={idx} className="border-b border-slate-100 dark:border-zinc-800 last:border-0 pb-4 last:pb-0">
                        <button 
                          onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                          className="w-full flex items-center justify-between text-left py-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                        >
                          <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors pr-4">{faq.question}</span>
                          <div className={`p-1.5 rounded-full transition-all shrink-0 ${openFaqIndex === idx ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'}`}>
                            <ChevronDown size={14} />
                          </div>
                        </button>
                        <div className={`grid transition-all duration-300 ease-in-out ${openFaqIndex === idx ? 'grid-rows-[1fr] opacity-100 mb-2' : 'grid-rows-[0fr] opacity-0'}`}>
                          <div className="overflow-hidden">
                            <p className="text-slate-500 dark:text-zinc-500 text-xs font-medium leading-relaxed pl-1 pt-2">{faq.answer}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 p-10 shadow-sm flex flex-col h-full relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent pointer-events-none transition-opacity group-hover:opacity-100" />
                   
                   <div className="relative z-10 flex flex-col h-full items-center text-center justify-center space-y-8 py-10">
                      <div className="w-28 h-28 bg-red-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_-10px_rgba(220,38,38,0.5)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border-4 border-white dark:border-zinc-800">
                         <Youtube size={48} fill="currentColor" />
                      </div>
                      
                      <div className="space-y-4 max-w-sm">
                         <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Video Masterclass</h3>
                         <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 leading-relaxed">
                            Watch in-depth guides, troubleshooting workflows, and platform tutorials on our official channel.
                         </p>
                      </div>

                      <a 
                         href="https://youtube.com/playlist?list=PL_XrvC-PjJ7fBp7nPJCmXmpTdDIlbzG5-&si=QIREBnSX8BsLEgdT" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                      >
                         Visit Channel <ExternalLink size={16} />
                      </a>
                   </div>
                   
                   {/* Decor */}
                   <div className="absolute -bottom-12 -right-12 opacity-[0.05] text-red-600 rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-700">
                      <Play size={240} fill="currentColor" />
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Knowledge' && (
            <div className="animate-in fade-in space-y-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Knowledge Base</h3>
                  <p className="text-slate-500 dark:text-zinc-500 font-medium mt-1">Curated guides and video tutorials.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {videos.map(video => (
                  <div key={video.id} className="group relative bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer">
                    <div className={`h-48 ${video.thumbnail || 'bg-slate-200'} relative flex items-center justify-center group-hover:scale-105 transition-transform duration-500`}>
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                        <PlayCircle size={32} fill="currentColor" className="opacity-90" />
                      </div>
                      <span className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-black rounded-lg">
                        {video.duration}
                      </span>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-black text-slate-900 dark:text-white leading-tight pr-4">{video.title}</h4>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteVideo(video.id); }}
                          className="text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Video Tutorial</p>
                    </div>
                  </div>
                ))}
                
                {filteredArticles.map(article => (
                  <div key={article.id} onClick={() => setSelectedArticle(article)} className="p-8 bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-200 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all group cursor-pointer hover:shadow-xl">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                      </div>
                      {bookmarks.includes(article.id) && (
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500 rounded-full">
                           <Bookmark size={14} fill="currentColor" />
                        </div>
                      )}
                      <span className="text-[10px] font-black bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-3 py-1 rounded-lg uppercase tracking-widest">{article.category}</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{article.title}</h4>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-4">
                      <span className="flex items-center"><Clock size={12} className="mr-1.5" /> {article.time}</span>
                      <span className="flex items-center"><Eye size={12} className="mr-1.5" /> {article.reads}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Chat' && (
            <div className="flex flex-col h-[700px] bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden relative">
              <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 z-10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
                      <Bot size={24} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Zify AI Support</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">AI Powered Assistant</p>
                  </div>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl transition-all text-slate-400 dark:text-zinc-500"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-700 rounded-2xl shadow-xl z-50 py-2 animate-in zoom-in-95">
                      <button onClick={handleClearChat} className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-700 flex items-center gap-2">
                        <Trash2 size={14} /> Clear History
                      </button>
                      <button onClick={handleDownloadChat} className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-700 flex items-center gap-2">
                        <Download size={14} /> Download Transcript
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 dark:bg-black/20 scroll-smooth">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[80%] ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-[2rem] rounded-tr-none' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-100 dark:border-zinc-700 rounded-[2rem] rounded-tl-none'} p-6 shadow-sm`}>
                      <FormattedText text={msg.text} role={msg.sender} />
                      <p className={`text-[9px] font-black uppercase mt-3 tracking-widest opacity-60 ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start animate-in fade-in">
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-[2rem] rounded-tl-none border border-slate-100 dark:border-zinc-700 shadow-sm flex gap-2">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800">
                <div className="relative flex items-end gap-3 bg-slate-50 dark:bg-black rounded-[2rem] border border-slate-200 dark:border-zinc-800 p-2 shadow-inner focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all">
                  <textarea
                    ref={textareaRef}
                    className="w-full max-h-32 bg-transparent border-none outline-none resize-none py-3 px-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                    placeholder="Ask about billing, API, or configuration..."
                    rows={1}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <div className="flex items-center gap-2 pb-2 pr-2">
                    <button onClick={() => insertFormat('`')} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all" title="Code Block"><Code size={16}/></button>
                    <button onClick={() => handleSendMessage()} disabled={!chatInput.trim()} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Help;
