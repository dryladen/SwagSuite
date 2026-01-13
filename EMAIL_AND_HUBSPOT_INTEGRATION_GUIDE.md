# Email & HubSpot Integration Implementation Guide

## Table of Contents
1. [Email Integration with Nodemailer](#email-integration)
2. [HubSpot CRM Integration](#hubspot-integration)
3. [Implementation Steps](#implementation-steps)

---

## Email Integration with Nodemailer

### Why Nodemailer?
✅ **Nodemailer adalah pilihan terbaik** untuk Node.js email karena:
- Most popular email library (20M+ downloads/week)
- Support semua SMTP providers (Gmail, Outlook, SendGrid, AWS SES, etc.)
- Support HTML templates dan attachments
- Well documented dan maintained
- TypeScript support

### Current State
Sistem sudah punya:
- ✅ UI untuk send email di `OrderDetailsModal.tsx`
- ✅ Database table `communications` untuk menyimpan email history
- ✅ API endpoint `/api/orders/:orderId/communications`
- ❌ **BELUM ADA**: Email service yang actual mengirim email

### Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  OrderDetails   │─────▶│   API Endpoint   │─────▶│  Email Service  │
│     Modal       │      │  /communications │      │  (Nodemailer)   │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                                            │
                                                            ▼
                                                    ┌─────────────────┐
                                                    │  SMTP Provider  │
                                                    │ (Gmail/SendGrid)│
                                                    └─────────────────┘
```

### Implementation Plan

#### Step 1: Install Dependencies
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

#### Step 2: Add Email Settings to Integration Settings

Update `shared/schema.ts` - add ke `integrationSettings` table:
```typescript
export const integrationSettings = pgTable("integration_settings", {
  // ... existing fields
  
  // Email Integration
  emailProvider: varchar("email_provider"), // 'smtp', 'gmail', 'sendgrid', 'ses'
  smtpHost: varchar("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUser: varchar("smtp_user"),
  smtpPassword: text("smtp_password"),
  emailFromAddress: varchar("email_from_address"), // Dynamic "From" address
  emailFromName: varchar("email_from_name"),
  emailReplyTo: varchar("email_reply_to"),
  
  // ... rest of fields
});
```

#### Step 3: Create Migration
```sql
-- migrations/0005_add_email_settings.sql
ALTER TABLE "integration_settings" ADD COLUMN "email_provider" varchar;
ALTER TABLE "integration_settings" ADD COLUMN "smtp_host" varchar;
ALTER TABLE "integration_settings" ADD COLUMN "smtp_port" integer;
ALTER TABLE "integration_settings" ADD COLUMN "smtp_user" varchar;
ALTER TABLE "integration_settings" ADD COLUMN "smtp_password" text;
ALTER TABLE "integration_settings" ADD COLUMN "email_from_address" varchar;
ALTER TABLE "integration_settings" ADD COLUMN "email_from_name" varchar;
ALTER TABLE "integration_settings" ADD COLUMN "email_reply_to" varchar;
```

#### Step 4: Create Email Service

Create `server/emailService.ts`:
```typescript
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { storage } from './storage';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
}

class EmailService {
  private transporter: Transporter | null = null;

  async initialize() {
    const settings = await storage.getIntegrationSettings();
    
    if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPassword) {
      throw new Error('Email settings not configured');
    }

    this.transporter = nodemailer.createTransporter({
      host: settings.smtpHost,
      port: settings.smtpPort || 587,
      secure: settings.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    });

    // Verify connection
    await this.transporter.verify();
    console.log('✓ Email service initialized successfully');
  }

  async sendEmail(options: EmailOptions) {
    if (!this.transporter) {
      await this.initialize();
    }

    const settings = await storage.getIntegrationSettings();
    
    const info = await this.transporter!.sendMail({
      from: `"${settings?.emailFromName || 'SwagSuite'}" <${settings?.emailFromAddress || settings?.smtpUser}>`,
      to: options.to,
      replyTo: settings?.emailReplyTo || settings?.emailFromAddress,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });

    console.log('Email sent:', info.messageId);
    return info;
  }

  async sendClientEmail(data: {
    to: string;
    subject: string;
    body: string;
    orderNumber?: string;
  }) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${data.subject}</h2>
        ${data.orderNumber ? `<p><strong>Order #:</strong> ${data.orderNumber}</p>` : ''}
        <div style="margin-top: 20px;">
          ${data.body.replace(/\n/g, '<br>')}
        </div>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          This email was sent from SwagSuite Order Management System.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: data.to,
      subject: data.subject,
      html,
      text: data.body,
    });
  }

  async sendVendorEmail(data: {
    to: string;
    subject: string;
    body: string;
    orderNumber?: string;
  }) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">${data.subject}</h2>
        ${data.orderNumber ? `<p><strong>PO #:</strong> ${data.orderNumber}</p>` : ''}
        <div style="margin-top: 20px;">
          ${data.body.replace(/\n/g, '<br>')}
        </div>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          This is an automated email from SwagSuite.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: data.to,
      subject: data.subject,
      html,
      text: data.body,
    });
  }
}

export const emailService = new EmailService();
```

#### Step 5: Update API Endpoint

Update `/api/orders/:orderId/communications` di `server/routes.ts`:
```typescript
import { emailService } from './emailService';

app.post("/api/orders/:orderId/communications", async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      communicationType,
      direction,
      recipientEmail,
      subject,
      body,
    } = req.body;
    
    // ... existing validation and database save code ...

    // Actually send the email
    if (direction === 'sent') {
      try {
        const order = await storage.getOrder(orderId);
        
        if (communicationType === 'client_email') {
          await emailService.sendClientEmail({
            to: recipientEmail,
            subject,
            body,
            orderNumber: order?.orderNumber,
          });
        } else if (communicationType === 'vendor_email') {
          await emailService.sendVendorEmail({
            to: recipientEmail,
            subject,
            body,
            orderNumber: order?.orderNumber,
          });
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Still save to database even if email fails
        return res.status(207).json({
          ...newCommunication,
          emailStatus: 'failed',
          emailError: emailError.message,
        });
      }
    }

    res.json(newCommunication);
  } catch (error) {
    console.error("Error creating communication:", error);
    res.status(500).json({ error: "Failed to create communication" });
  }
});
```

#### Step 6: Add Email Settings UI

Create `client/src/pages/settings/email-settings.tsx`:
```typescript
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function EmailSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState({
    emailProvider: 'smtp',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    emailFromAddress: '',
    emailFromName: '',
    emailReplyTo: '',
  });

  const { data: currentSettings } = useQuery({
    queryKey: ['/api/settings/integrations'],
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      const response = await fetch('/api/settings/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Email settings saved successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/integrations'] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>SMTP Host</Label>
            <Input
              value={settings.smtpHost}
              onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div>
            <Label>SMTP Port</Label>
            <Input
              type="number"
              value={settings.smtpPort}
              onChange={(e) => setSettings({...settings, smtpPort: parseInt(e.target.value)})}
            />
          </div>
          <div>
            <Label>SMTP User</Label>
            <Input
              value={settings.smtpUser}
              onChange={(e) => setSettings({...settings, smtpUser: e.target.value})}
              placeholder="your-email@gmail.com"
            />
          </div>
          <div>
            <Label>SMTP Password</Label>
            <Input
              type="password"
              value={settings.smtpPassword}
              onChange={(e) => setSettings({...settings, smtpPassword: e.target.value})}
            />
          </div>
          <div>
            <Label>From Email Address</Label>
            <Input
              value={settings.emailFromAddress}
              onChange={(e) => setSettings({...settings, emailFromAddress: e.target.value})}
              placeholder="orders@yourcompany.com"
            />
          </div>
          <div>
            <Label>From Name</Label>
            <Input
              value={settings.emailFromName}
              onChange={(e) => setSettings({...settings, emailFromName: e.target.value})}
              placeholder="SwagSuite Orders"
            />
          </div>
        </div>
        <Button onClick={() => saveSettingsMutation.mutate(settings)}>
          Save Email Settings
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Common SMTP Providers Setup

#### Gmail
```
Host: smtp.gmail.com
Port: 587
User: your-email@gmail.com
Password: App Password (buat di Google Account Settings)
```

#### SendGrid
```
Host: smtp.sendgrid.net
Port: 587
User: apikey
Password: Your SendGrid API Key
```

#### AWS SES
```
Host: email-smtp.us-east-1.amazonaws.com
Port: 587
User: Your SMTP Username
Password: Your SMTP Password
```

---

## HubSpot CRM Integration

### Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   HubSpot CRM   │◀────▶│  Webhook/Polling │─────▶│  Sync Service   │
│                 │      │     Handler      │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                                            │
                                                            ▼
                                                    ┌─────────────────┐
                                                    │  SwagSuite DB   │
                                                    │  Companies      │
                                                    │  Contacts       │
                                                    └─────────────────┘
```

### Implementation Options

**Option 1: Webhook (Recommended)**
- Real-time sync
- HubSpot pushes updates ke sistem kita
- More efficient

**Option 2: Polling**
- Periodic sync (setiap 5/15/30 menit)
- Kita pull data dari HubSpot
- Simpler to implement

### Implementation Plan

#### Step 1: Install HubSpot SDK
```bash
npm install @hubspot/api-client
```

#### Step 2: Create HubSpot Service

Create `server/hubspotService.ts`:
```typescript
import { Client } from '@hubspot/api-client';
import { storage } from './storage';

class HubSpotService {
  private client: Client | null = null;

  async initialize() {
    const settings = await storage.getIntegrationSettings();
    
    if (!settings?.hubspotApiKey) {
      throw new Error('HubSpot API key not configured');
    }

    this.client = new Client({
      accessToken: settings.hubspotApiKey,
    });

    console.log('✓ HubSpot service initialized');
  }

  async getClient() {
    if (!this.client) {
      await this.initialize();
    }
    return this.client!;
  }

  // Sync single contact from HubSpot
  async syncContact(hubspotContactId: string) {
    const client = await this.getClient();
    
    try {
      const contact = await client.crm.contacts.basicApi.getById(hubspotContactId, [
        'firstname',
        'lastname',
        'email',
        'phone',
        'company',
        'jobtitle',
      ]);

      const properties = contact.properties;

      // Find or create company first if associated
      let companyId: string | undefined;
      if (properties.company) {
        const existingCompany = await storage.getCompanyByName(properties.company);
        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          const newCompany = await storage.createCompany({
            name: properties.company,
            type: 'client',
            status: 'active',
          });
          companyId = newCompany.id;
        }
      }

      // Check if contact already exists
      const existingContact = await storage.getContactByEmail(properties.email);

      if (existingContact) {
        // Update existing contact
        return await storage.updateContact(existingContact.id, {
          firstName: properties.firstname,
          lastName: properties.lastname,
          email: properties.email,
          phone: properties.phone,
          jobTitle: properties.jobtitle,
          companyId,
          hubspotId: hubspotContactId,
        });
      } else {
        // Create new contact
        return await storage.createContact({
          firstName: properties.firstname,
          lastName: properties.lastname,
          email: properties.email,
          phone: properties.phone,
          jobTitle: properties.jobtitle,
          companyId,
          hubspotId: hubspotContactId,
        });
      }
    } catch (error) {
      console.error('Failed to sync HubSpot contact:', error);
      throw error;
    }
  }

  // Sync single company from HubSpot
  async syncCompany(hubspotCompanyId: string) {
    const client = await this.getClient();
    
    try {
      const company = await client.crm.companies.basicApi.getById(hubspotCompanyId, [
        'name',
        'domain',
        'phone',
        'address',
        'city',
        'state',
        'zip',
        'country',
        'industry',
      ]);

      const properties = company.properties;

      // Check if company already exists
      const existingCompany = await storage.getCompanyByHubSpotId(hubspotCompanyId);

      const companyData = {
        name: properties.name,
        website: properties.domain,
        phone: properties.phone,
        address: [
          properties.address,
          properties.city,
          properties.state,
          properties.zip,
          properties.country,
        ].filter(Boolean).join(', '),
        industry: properties.industry,
        type: 'client' as const,
        status: 'active' as const,
        hubspotId: hubspotCompanyId,
      };

      if (existingCompany) {
        return await storage.updateCompany(existingCompany.id, companyData);
      } else {
        return await storage.createCompany(companyData);
      }
    } catch (error) {
      console.error('Failed to sync HubSpot company:', error);
      throw error;
    }
  }

  // Get recent contacts (for polling)
  async getRecentContacts(since: Date) {
    const client = await this.getClient();
    
    const response = await client.crm.contacts.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'lastmodifieddate',
          operator: 'GTE',
          value: since.getTime().toString(),
        }],
      }],
      properties: ['firstname', 'lastname', 'email', 'phone', 'company', 'jobtitle'],
      limit: 100,
    });

    return response.results;
  }

  // Get recent companies (for polling)
  async getRecentCompanies(since: Date) {
    const client = await this.getClient();
    
    const response = await client.crm.companies.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'hs_lastmodifieddate',
          operator: 'GTE',
          value: since.getTime().toString(),
        }],
      }],
      properties: ['name', 'domain', 'phone', 'address', 'city', 'state', 'zip', 'industry'],
      limit: 100,
    });

    return response.results;
  }
}

export const hubspotService = new HubSpotService();
```

#### Step 3: Add Webhook Endpoint

Add to `server/routes.ts`:
```typescript
import { hubspotService } from './hubspotService';

// HubSpot Webhook Endpoint
app.post('/api/webhooks/hubspot', async (req, res) => {
  try {
    const events = req.body;

    // HubSpot sends array of events
    for (const event of events) {
      const { subscriptionType, objectId } = event;

      if (subscriptionType === 'contact.creation' || subscriptionType === 'contact.propertyChange') {
        // Sync contact
        await hubspotService.syncContact(objectId.toString());
        console.log(`Synced HubSpot contact: ${objectId}`);
      } else if (subscriptionType === 'company.creation' || subscriptionType === 'company.propertyChange') {
        // Sync company
        await hubspotService.syncCompany(objectId.toString());
        console.log(`Synced HubSpot company: ${objectId}`);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('HubSpot webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Manual sync endpoint (for testing or manual triggers)
app.post('/api/integrations/hubspot/sync', isAuthenticated, async (req, res) => {
  try {
    const { type, id } = req.body; // type: 'contact' or 'company'

    if (type === 'contact') {
      const contact = await hubspotService.syncContact(id);
      res.json({ success: true, contact });
    } else if (type === 'company') {
      const company = await hubspotService.syncCompany(id);
      res.json({ success: true, company });
    } else {
      res.status(400).json({ error: 'Invalid type' });
    }
  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({ error: 'Failed to sync' });
  }
});

// Polling sync endpoint (runs periodically via cron)
app.post('/api/integrations/hubspot/poll', isAuthenticated, async (req, res) => {
  try {
    // Get last sync time from database or use 1 hour ago
    const lastSync = new Date(Date.now() - 60 * 60 * 1000);

    const [contacts, companies] = await Promise.all([
      hubspotService.getRecentContacts(lastSync),
      hubspotService.getRecentCompanies(lastSync),
    ]);

    // Sync all recent contacts
    for (const contact of contacts) {
      await hubspotService.syncContact(contact.id);
    }

    // Sync all recent companies
    for (const company of companies) {
      await hubspotService.syncCompany(company.id);
    }

    res.json({
      success: true,
      synced: {
        contacts: contacts.length,
        companies: companies.length,
      },
    });
  } catch (error) {
    console.error('Polling sync error:', error);
    res.status(500).json({ error: 'Failed to poll' });
  }
});
```

#### Step 4: Update Database Schema

Add `hubspotId` fields:
```sql
-- migrations/0006_add_hubspot_ids.sql
ALTER TABLE "contacts" ADD COLUMN "hubspot_id" varchar;
ALTER TABLE "companies" ADD COLUMN "hubspot_id" varchar;

CREATE UNIQUE INDEX IF NOT EXISTS "contacts_hubspot_id_idx" ON "contacts"("hubspot_id");
CREATE UNIQUE INDEX IF NOT EXISTS "companies_hubspot_id_idx" ON "companies"("hubspot_id");
```

Update schemas:
```typescript
// shared/schema.ts
export const contacts = pgTable("contacts", {
  // ... existing fields
  hubspotId: varchar("hubspot_id"),
  // ...
});

export const companies = pgTable("companies", {
  // ... existing fields
  hubspotId: varchar("hubspot_id"),
  // ...
});
```

#### Step 5: Setup HubSpot Webhook in HubSpot Dashboard

1. Go to HubSpot Settings → Integrations → Private Apps
2. Create a new Private App
3. Give it scopes: `crm.objects.contacts.read`, `crm.objects.companies.read`
4. Copy the API key
5. Go to Settings → Integrations → Webhooks
6. Create webhook subscriptions:
   - `contact.creation`
   - `contact.propertyChange`
   - `company.creation`
   - `company.propertyChange`
7. Set target URL: `https://your-domain.com/api/webhooks/hubspot`

#### Step 6: Add Storage Methods

Add to `server/storage.ts`:
```typescript
async getContactByEmail(email: string) {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.email, email))
    .limit(1);
  return contact;
}

async getCompanyByName(name: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.name, name))
    .limit(1);
  return company;
}

async getCompanyByHubSpotId(hubspotId: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.hubspotId, hubspotId))
    .limit(1);
  return company;
}
```

---

## Implementation Steps Summary

### Phase 1: Email (1-2 days)
1. ✅ Install nodemailer
2. ✅ Add email fields to integration_settings schema
3. ✅ Run migration
4. ✅ Create emailService.ts
5. ✅ Update communications API endpoint
6. ✅ Add email settings UI
7. ✅ Test with Gmail/SendGrid

### Phase 2: HubSpot (2-3 days)
1. ✅ Install @hubspot/api-client
2. ✅ Add hubspotId fields to contacts & companies
3. ✅ Run migration
4. ✅ Create hubspotService.ts
5. ✅ Add webhook endpoint
6. ✅ Setup HubSpot webhook in dashboard
7. ✅ Test sync functionality

### Testing Checklist

#### Email Testing
- [ ] Configure SMTP settings
- [ ] Send client email from order detail
- [ ] Send vendor email from order detail
- [ ] Verify email received
- [ ] Check email history in communications tab
- [ ] Test with different email providers

#### HubSpot Testing
- [ ] Configure HubSpot API key
- [ ] Create test contact in HubSpot
- [ ] Verify contact syncs to SwagSuite
- [ ] Create test company in HubSpot
- [ ] Verify company syncs to SwagSuite
- [ ] Update contact in HubSpot
- [ ] Verify update syncs
- [ ] Test manual sync endpoint
- [ ] Test polling sync

---

## Next Steps

1. **Prioritas**: Implement email first (lebih critical)
2. **Testing**: Setup test SMTP dulu (bisa pakai Gmail)
3. **HubSpot**: After email works, implement HubSpot
4. **Monitoring**: Add logging untuk track sync status
5. **Error Handling**: Add retry logic untuk failed syncs

## Questions?

Let me know kalau ada yang perlu dijelasin lebih detail atau mau mulai implementasi bagian mana dulu!
