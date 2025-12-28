# SwagSuite - Client Requirements

## 📋 PROJECT SUMMARY
**SwagSuite** adalah sistem Order Management System (OMS) untuk industri promotional products yang mengintegrasikan CRM, production tracking, artwork management, dan sales automation dengan AI-powered features.

---

## 🎯 CORE OBJECTIVES

1. **Centralized Order Management** - Mengelola seluruh lifecycle order dari quote hingga shipping
2. **AI-Powered Automation** - Otomasi komunikasi, follow-up, dan content generation
3. **Real-time Integration** - Sync dengan HubSpot, ESP/ASI, SAGE, S&S Activewear, Slack
4. **Production Tracking** - Visual tracking order stages dengan customizable workflows
5. **Sales Enablement** - Tools untuk mockup, presentation, dan sequence building

---

## 🏗️ MAIN PAGES & FEATURES

### 1. **Dashboard**
**Purpose:** Home screen dengan customizable KPI widgets

**Key Features:**
- Team KPI Leaderboard
- Financial metrics (YTD, MTD, WTD, custom dates)
  - Revenue, Margin %, Order avg, Order quantity
- HubSpot pipeline integration
- Invoicing overview (aging reports: 60, 90+ days)
- Slack integration widget
- AI-powered Customer & Vendor Breaking News
  - Auto-scan web for noteworthy news
  - Auto-notify sales reps with drafted messages
- Most Popular Items (Apparel vs Hard Goods)
  - Toggle: WTD, MTD, YTD, custom
  - Vertical scroll (show 3, scroll to 10)
  - AI search capability
- Suggested Items section

### 2. **CRM**
**Purpose:** Customer relationship management dengan HubSpot real-time sync

#### A. **Customers/Companies**
- Multiple addresses support
- YTD spend tracking & custom date reports
- Social media integration (LinkedIn, Twitter, Facebook)
  - Display recent posts
  - Flag "exciting news" → auto-add to News & Alerts
- AI suggestions based on:
  - Order history
  - Similar companies' orders
  - Recurring event reminders

#### B. **Leads**
- Integrations: Apollo.ai, Zoominfo
- AI-drafted outreach & follow-ups
- Marketing sequences (HubSpot-style) built-in
- AI incorporates latest news into drafts

#### C. **Vendors**
- Import from ASI/ESP, SAGE
- **Automated messaging:**
  - No confirmation after 1 day → auto-draft reminder
  - Spending milestones (match LYTD, +50%, +100%) → request benefits
  - Notify Vendor Relations Director for approval
- **Preferred Vendors tab** (separate):
  - Card/List view, clickable
  - Track: EQP pricing, rebate %, free setups, spec samples, self-promos
  - Savings calculator: EQP savings, YTD rebates, promos sent

### 3. **Orders**
**Purpose:** Main area untuk placing & tracking orders

**Features:**
- Start at any stage (quote → sales order → production)
- Integration: ESP/ASI, SAGE, Distributor Central, S&S Activewear
- **Project Overview:**
  - Timeline view (like social media feed)
  - Show all actions with user attribution
  - @mention tagging → email & notifications
  - Clickable items to navigate order details
  - Send emails to clients/vendors from popup

**Order Types:**
- **Products:** Add via ESP/ASI/SAGE/DC search or manual
  - Duplicate detection → recommend cheaper options
- **Quotes:** Create from products page
- **Sales Orders:**
  - Send to client for approval
  - Upon approval → tag production lead + Kanban board
  - Include: IHD (customer), Supplier IHD, Event Date
  - Auto-generate mockup preview (product + artwork + color)
- **Artwork Proofing:**
  - Approval workflow with notifications
  - Auto-follow-up if no approval in 1 business day
  - Flag reps if delays occur

### 4. **Production Report**
**Purpose:** Visual tracking untuk orders in production

**Features:**
- Customizable stages (default):
  1. Sales Order Booked
  2. Purchase Order placed
  3. Confirmation received from vendor
  4. Proof received from vendor
  5. Proof approved by client
  6. Order placed
  7. Invoice paid by customer
  8. Shipping scheduled
  9. Shipped
  10. Next action
- **Next Action Date:** Daily notifications to production rep
- Drag-to-rearrange stages, add custom steps
- Click order → popup with full order details
- Input tracking numbers, custom messages inline

### 5. **Artwork (Kanban Board)**
**Purpose:** Trello-style artwork management

**Features:**
- **Default columns:**
  - PMS Colors
  - Artist Schedule
  - Artwork to Do
  - In Progress
  - Questions & Clarifications
  - For Review
  - Sent to Client
  - Completed
- Add custom columns
- **Cards:**
  - Tied to customer & order
  - Upload files: .ai, .eps, .jpeg, .png, .pdf
  - Image preview
  - Clickable for editing
  - Edit attached files

### 6. **Mock-up Builder**
**Purpose:** Visual product mockup tool

**Features:**
- Input product number → pull from ESP/ASI/SAGE
- Insert logo (.ai, .eps, .jpeg, .png, .pdf)
- Move, resize, recolor logo (PMS, Hex, color picker)
- Remove background
- Download or email directly
- Link to client folder/order
- **Templates:**
  - Company-wide header/footer
  - Customer version (customer + company logos) - AI-suggested

### 7. **AI Presentation Builder**
**Purpose:** Auto-generate product presentations

**Features:**
- Import deal notes (native or HubSpot)
- Import files (.ai, .eps, .jpeg, .png, .pdf)
- AI suggests products based on:
  - Pricing, quantities, item types
  - Deal context

### 8. **Sequence Builder**
**Purpose:** HubSpot-style sales automation

**Features:**
- Create, edit, manage email outreach sequences
- Tasks & reminders
- AI-generated sequences (new/existing clients)
- Analytics:
  - Open rate, meeting rate, interaction rate, closed rate
- AI suggests flow, manual override available

### 9. **Newsletter**
**Purpose:** MailChimp/Constant Contact-style email marketing

**Features:**
- Subscriber management with segmentation
- Drag-and-drop email editor
- Template gallery
- **Automated campaigns:**
  - Drip sequences, birthdays, RSS-to-email
- Performance dashboards (opens, clicks, conversions, A/B testing)
- Signup forms, surveys, landing pages
- Social media & e-commerce integrations
- AI design suggestions
- Mobile-friendly, role-based access

### 10. **Errors Section**
**Purpose:** Track & analyze order errors for KPI improvement

**Fields:**
- Date, Project Number
- Error Type (dropdown): Pricing, In-hands date, Shipping, Printing, Artwork/Proofing, OOS, Other
- Client Name, Vendor Name
- Responsible Party: Customer, Vendor, LSD
- Resolution (dropdown): Refund, Credit, Reprint, Courier/Shipping, Other
- Cost to LSD
- Production Rep, Order Rep, Client Rep
- Additional notes

**Reporting:**
- YTD, MTD, custom dates
- Comparisons: LYTD, LMTD, Last Year

### 11. **Settings (Admin)**
**Purpose:** System-wide configuration

**Features:**
1. Change logo (jpeg, png, pdf)
2. Change system colors
3. Customize fields (sales orders, purchase orders)
4. **Mass data import:**
   - Upload: .xls, .csv, Google Drive, .pdf, .ai, Word
   - AI reviews & rebuilds:
     - Clients, companies, orders, artwork, POs, sales orders, quotes, proofing
5. Weekly email report configuration

---

## 🔗 INTEGRATIONS

### ✅ **Required Real Integrations:**
1. **HubSpot** - Real-time CRM sync, deal notes
2. **ESP/ASI** - Product details & pricing (https://developers.asicentral.com/)
3. **SAGE** - Product catalog
4. **S&S Activewear** - API Key: `1812622b-59cd-4863-8a9f-ad64eee5cd22`, Account: `52733`
5. **Slack** - Token provided
6. **Apollo.ai** - Lead generation
7. **Zoominfo** - Lead enrichment
8. **Distributor Central** - Product search
9. **SendGrid** - Email sending
10. **Anthropic AI (Claude)** - AI features throughout

### 📊 **Current Status:**
| Integration         | Status |
|---------------------|--------|
| Slack               | ✅ Real |
| S&S Activewear      | ✅ Real |
| SendGrid            | ✅ Real |
| Anthropic AI        | ✅ Real |
| HubSpot             | ⚙️ Mock - Need to implement |
| SAGE                | ⚙️ Mock - Need to implement |
| ESP                 | ⚙️ Mock - Need to implement |
| Distributor Central | ⚙️ Mock - Need to implement |
| QuickBooks          | ❌ Missing |
| Stripe              | ❌ Missing |

---

## 🤖 AI-POWERED FEATURES

1. **Global AI Search Bar** (on every page)
   - Natural language queries
   - Example: "what are the last three orders and margins?"
   - Example: "i need the .ai file for the Beber logo"

2. **Auto-drafted Communications**
   - Vendor follow-ups (no confirmation)
   - Customer outreach based on news
   - Benefit negotiation emails
   - Proof approval reminders

3. **AI Suggestions**
   - Product recommendations based on order history
   - Similar company patterns
   - Recurring event reminders
   - Sequence flows
   - Email design optimization

4. **News Monitoring**
   - Web scraping for customer/vendor news
   - "Exciting news" flagging
   - Auto-notify sales reps

---

## 📧 AUTOMATED COMMUNICATIONS

### Weekly User Report (Email)
- Orders placed
- Revenue
- Margin %
- New stores built
- Admin-configurable additional metrics

### Vendor Automation
- 1-day no-confirmation → reminder
- Spending milestones → benefit requests
- Vendor Relations Director approval workflow

### Customer Automation
- Proof approval reminders (1 business day)
- Breaking news notifications
- Sequence-based outreach

---

## 🎨 UI/UX REQUIREMENTS

1. **Customizable Dashboard** - per-user widgets
2. **Trello-style Kanban** - Artwork page
3. **Social Media Timeline** - Order overview
4. **Drag-and-Drop** - Newsletter editor, artwork cards
5. **Vertical Scrolling** - Popular items (3 visible, scroll to 10)
6. **Mobile-Friendly** - Responsive across all pages
7. **Role-Based Access** - User/Admin/Manager permissions

---

## 🔑 KEY TECHNICAL REQUIREMENTS

### Database Schema (52 Tables)
- PostgreSQL with Drizzle ORM
- Tables for: Users, Sessions, Companies, Contacts, Clients, Suppliers, Products, Orders, OrderItems, ArtworkFiles, ArtworkColumns, ArtworkCards, ProductionTracking, Sequences, SequenceSteps, NewsletterCampaigns, NewsletterSubscribers, Presentations, Errors, KPIMetrics, KnowledgeBase, etc.

### File Support
- Upload/preview: .ai, .eps, .jpeg, .png, .pdf, .xls, .csv, Word docs
- Image manipulation (resize, recolor, background removal)
- Multi-file attachment per order/card

### Notifications
- Email notifications (SendGrid)
- In-app notifications
- @mention tagging system
- Daily task reminders

### Reporting & Analytics
- Time-based filters: YTD, MTD, WTD, LYTD, LMTD, custom dates
- KPI dashboards
- Error tracking & analysis
- Sequence performance metrics
- Newsletter campaign analytics

---

## ✅ IMPLEMENTATION PRIORITIES

### Phase 1 - Core OMS (CURRENT)
- ✅ Orders management
- ✅ Products catalog
- ✅ Basic CRM
- ✅ Production tracking
- ✅ Artwork kanban
- ✅ Dashboard with KPIs

### Phase 2 - Integrations (HIGH PRIORITY)
- ⚠️ HubSpot real-time sync
- ⚠️ ESP/ASI product API
- ⚠️ SAGE integration
- ✅ S&S Activewear
- ✅ Slack
- ⚠️ Apollo.ai & Zoominfo

### Phase 3 - AI Features (HIGH PRIORITY)
- ⚠️ Global AI search
- ⚠️ Auto-drafted communications
- ⚠️ News monitoring & alerts
- ⚠️ Product suggestions
- ⚠️ Sequence AI generation

### Phase 4 - Sales Tools (MEDIUM PRIORITY)
- ⚠️ Mock-up builder
- ⚠️ AI Presentation builder
- ⚠️ Sequence builder
- ⚠️ Newsletter module

### Phase 5 - Advanced Features (LOWER PRIORITY)
- Mass data import with AI
- QuickBooks integration
- Stripe payment processing
- Advanced analytics

---

## 📝 NOTES FROM CLIENT

1. **Artwork proofing** - Text cut off in original prompt but implies auto-follow-up system
2. **S&S Activewear** - Client reported connection issues, wants direct product lookup by SKU
3. **Popular Items** - Must show 3 items initially, scroll vertically to 10
4. **Preferred Vendors** - Should be separate tab, not mixed with regular vendors
5. **Order Overview** - Timeline must look like social media feed with @mentions
6. **Mock-up Builder** - Should auto-generate product preview with logo overlay
7. **Newsletter** - Full MailChimp/Constant Contact clone requested

---

## 🚀 SUCCESS METRICS

1. **Order Processing Time** - Reduce quote-to-order time by 50%
2. **Automation Rate** - 80% of routine communications auto-drafted
3. **Sales Rep Efficiency** - Track orders, mockups, presentations per rep
4. **Customer Engagement** - Monitor news alerts, sequence open rates
5. **Error Reduction** - Track error types, responsible parties, costs
6. **Vendor Optimization** - Measure EQP savings, rebate tracking
7. **Production Velocity** - Visual tracking of bottlenecks by stage
