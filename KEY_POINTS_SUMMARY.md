# SwagSuite - Key Points & Action Items

## 🎯 INTI PROJEK

**SwagSuite** = Order Management System untuk industri promotional products (kaos, tumbler, merchandise) dengan fokus pada:
- **Automation** → AI draft email, follow-up otomatis, news monitoring
- **Integration** → HubSpot, ESP/ASI, SAGE, S&S Activewear, Slack
- **Tracking** → Visual production stages, artwork workflow, error analytics
- **Sales Tools** → Mockup builder, presentation AI, sequence automation

---

## 🔴 CRITICAL PRIORITIES (HARUS SEGERA)

### 1. **Real Integrations** ⚠️
- [ ] **HubSpot** - Real-time sync CRM (currently mock)
- [ ] **ESP/ASI API** - Product catalog & pricing (currently mock)
- [ ] **SAGE** - Vendor products (currently mock)
- [ ] **S&S Activewear** - Fix product lookup by SKU (client reported broken)

### 2. **AI Features** ⚠️
- [ ] **Global AI Search** - Natural language search di setiap page
- [ ] **Auto-draft Communications** - Email ke vendor & customer
- [ ] **News Monitoring** - Scrape web untuk customer/vendor news
- [ ] **Product Suggestions** - Based on order history & similar companies

### 3. **Production Workflow** ⚠️
- [ ] **Production Report** - Visual stage tracking dengan daily notifications
- [ ] **Artwork Kanban** - Trello-style dengan file preview
- [ ] **Order Timeline** - Social media-style dengan @mentions

---

## 📊 11 MAIN PAGES

| # | Page | Status | Key Feature |
|---|------|--------|-------------|
| 1 | **Dashboard** | ✅ Partial | KPI widgets, Slack, popular items, news alerts |
| 2 | **CRM** | ✅ Partial | Companies, contacts, leads (need HubSpot sync) |
| 3 | **Orders** | ✅ Working | Quotes → Sales Orders → Production |
| 4 | **Production Report** | ⚠️ Build | Visual stage tracking, daily notifications |
| 5 | **Artwork Kanban** | ⚠️ Build | Trello-style dengan file upload |
| 6 | **Mock-up Builder** | ⚠️ Build | Product + logo overlay tool |
| 7 | **AI Presentation** | ⚠️ Build | Auto-generate dari deal notes |
| 8 | **Sequence Builder** | ⚠️ Build | HubSpot-style email automation |
| 9 | **Newsletter** | ⚠️ Build | MailChimp clone |
| 10 | **Errors** | ⚠️ Build | Error tracking untuk KPI |
| 11 | **Settings** | ⚠️ Build | Branding, mass import, field customization |

---

## 🤖 AI AUTOMATION YANG DIMINTA

### Email Automation
1. **Vendor no confirmation** → After 1 day, auto-draft reminder
2. **Vendor spending milestone** → LYTD, +50%, +100% → request benefits
3. **Customer proof approval** → Auto-follow-up setelah 1 business day
4. **Breaking news** → Auto-notify sales rep dengan drafted message
5. **Sequence outreach** → AI-generate email flows untuk leads

### Intelligent Suggestions
1. **Product recommendations** → Based on order history
2. **Recurring events** → Remind sales rep dari patterns
3. **Similar companies** → Suggest products dari similar orders
4. **Cheaper alternatives** → Flag duplicate products dengan harga lebih murah
5. **Presentation products** → AI pick products dari deal notes

### News & Alerts
1. **Web scraping** → Monitor customer/vendor news
2. **"Exciting news" flagging** → From social media posts
3. **News feed** → Running scrawl di dashboard
4. **Auto-notification** → Email + in-app untuk assigned sales rep

---

## 🔗 INTEGRATION REQUIREMENTS

### ✅ Already Working
- **Slack** - Widget di dashboard, notifications
- **S&S Activewear** - Product API (but broken, needs fix)
- **SendGrid** - Email sending
- **Claude AI** - AI features

### ⚠️ Need Implementation
- **HubSpot** - Bi-directional sync CRM, deal notes, pipeline
- **ESP/ASI** - Product search & pricing (https://developers.asicentral.com/)
- **SAGE** - Vendor catalog & EQP pricing
- **Distributor Central** - Product lookup
- **Apollo.ai** - Lead generation
- **Zoominfo** - Lead enrichment

### ❌ Future/Optional
- **QuickBooks** - Accounting sync
- **Stripe** - Payment processing

---

## 🎨 UI/UX CRITICAL DETAILS

### Dashboard
- ✅ Team leaderboard
- ✅ Financial KPIs (YTD, MTD, WTD, custom)
- ⚠️ Slack widget
- ⚠️ Breaking news scrawl
- ⚠️ Popular items (apparel vs hard goods)
  - Show 3 items, **vertical scroll** to 10
  - AI search bar
- ⚠️ Suggested items section

### Orders (Project Overview)
- ⚠️ **Timeline view** - Like social media feed
- ⚠️ **@mention tagging** - Notify team members
- ⚠️ **Inline actions** - Send email to client/vendor from popup
- ⚠️ **Clickable everything** - Navigate to full order details

### Production Report
- ⚠️ **Visual stages** - See where each order sits
- ⚠️ **Drag to rearrange** - Custom stage order
- ⚠️ **Next action date** - Daily notifications
- ⚠️ **Inline editing** - Add tracking #, notes directly

### Artwork Kanban
- ⚠️ **Trello-style** - Drag & drop cards
- ⚠️ **File upload** - .ai, .eps, .jpeg, .png, .pdf
- ⚠️ **Image preview** - Show thumbnails
- ⚠️ **Clickable cards** - Edit inline
- ⚠️ **Custom columns** - Add/remove/reorder

### Mock-up Builder
- ⚠️ **Product lookup** - By SKU from ESP/ASI/SAGE
- ⚠️ **Logo overlay** - Drag, resize, recolor (PMS, Hex)
- ⚠️ **Background removal** - AI-powered
- ⚠️ **Templates** - Company-wide + customer-specific
- ⚠️ **Direct actions** - Download or email mockup

---

## 📧 AUTOMATED REPORTS

### Weekly User Email
Setiap user menerima email weekly dengan:
- Orders placed
- Revenue generated
- Margin %
- New stores built
- *Admin can add custom metrics*

### Daily Production Notifications
Production rep menerima daily email dengan:
- Next action items
- Upcoming deadlines
- Pending approvals

---

## 💾 DATA IMPORT REQUIREMENTS

### Mass Import Feature (Settings)
Client wants to upload existing data:
- **File types:** .xls, .csv, Google Drive, .pdf, .ai, Word
- **AI processing:** Review & categorize data
- **Auto-create:** Clients, companies, orders, artwork, POs, sales orders, quotes

---

## 🚨 CLIENT PAIN POINTS (FROM PROMPTS)

1. **S&S Integration Broken** - "It does not seem to work. I want to hit add product and put product number in..."
2. **Artwork Page Empty** - Multiple mentions of recreating Trello board
3. **Preferred Vendors** - "Please separate out the preferred vendors to be their own tab"
4. **Popular Items Scrolling** - "they should scroll **vertically** showing top 10, not horizontally"
5. **Order Overview** - Wants social media-style timeline with @mentions

---

## ✅ WHAT'S ALREADY BUILT

### Database (52 Tables)
- ✅ Users, sessions, authentication
- ✅ Companies, contacts, clients (CRM)
- ✅ Suppliers, products (multi-source)
- ✅ Orders, order items, artwork files
- ✅ Artwork columns, artwork cards (kanban)
- ✅ Production tracking, stages
- ✅ Sequences, sequence steps
- ✅ Newsletter campaigns, subscribers
- ✅ Errors, KPI metrics, presentations

### Server Routes
- ✅ `/api/orders` - CRUD operations
- ✅ `/api/products` - Product management
- ✅ `/api/companies` - CRM
- ✅ `/api/integrations/ss-activewear` - S&S API
- ✅ `/api/integrations/slack` - Slack
- ⚙️ `/api/integrations/hubspot/*` - Mock data
- ⚙️ `/api/integrations/esp/*` - Mock data
- ⚙️ `/api/integrations/sage/*` - Mock data

### Frontend Pages
- ✅ Dashboard (partial)
- ✅ CRM (old + new versions)
- ✅ Orders
- ✅ Products
- ✅ Artwork (structure only, no functionality)
- ✅ Mock-up Builder (basic)
- ✅ AI Presentation Builder (basic)
- ✅ Newsletter (basic)
- ❌ Production Report
- ❌ Sequence Builder
- ❌ Errors Section
- ❌ Preferred Vendors Tab

---

## 🎯 IMMEDIATE ACTION PLAN

### Week 1-2: Critical Integrations
1. Fix S&S Activewear product lookup
2. Implement real HubSpot API sync
3. Connect ESP/ASI product API
4. Setup SAGE integration

### Week 3-4: AI Features
1. Build global AI search (natural language)
2. Implement auto-draft email system
3. Setup news monitoring & scraping
4. Create product suggestion engine

### Week 5-6: Production Workflow
1. Build Production Report page
2. Complete Artwork Kanban functionality
3. Implement Order Timeline with @mentions
4. Daily notification system

### Week 7-8: Sales Tools
1. Complete Mock-up Builder
2. Enhance AI Presentation Builder
3. Build Sequence Builder
4. Newsletter drag-and-drop editor

### Week 9-10: Analytics & Polish
1. Build Errors tracking page
2. Preferred Vendors tab
3. Settings customization
4. Mass data import with AI

---

## 💡 TECHNICAL NOTES

### AI Provider
- **Anthropic Claude** - Already integrated
- Used for: Search, drafts, suggestions, presentations, news analysis

### File Handling
- **Supported:** .ai, .eps, .jpeg, .png, .pdf, .xls, .csv, Word
- Need: Image preview, background removal, color manipulation

### Real-time Features
- HubSpot bi-directional sync
- @mention notifications (email + in-app)
- Daily task reminders
- Breaking news alerts

### Performance Considerations
- YTD calculations across 52 tables
- AI search over entire database
- Image processing for mockups
- Real-time web scraping for news

---

## 🔐 API KEYS & CREDENTIALS

- **S&S Activewear:** `1812622b-59cd-4863-8a9f-ad64eee5cd22` (Account: 52733)
- **Slack:** Token provided in original prompts
- **ESP/ASI:** Need to register at https://developers.asicentral.com/
- **SAGE:** Need credentials
- **HubSpot:** Need OAuth setup
- **Claude AI:** Already configured
- **SendGrid:** Already configured

---

## 📈 SUCCESS CRITERIA

1. **Orders flow smoothly** from quote → sales order → production → shipping
2. **AI drafts 80%+ communications** that require minimal editing
3. **News monitoring** catches relevant updates within 24 hours
4. **Production tracking** shows real-time stage for every order
5. **Integrations sync** bi-directionally without manual intervention
6. **Sales reps spend 50% less time** on manual tasks
7. **Error tracking** reduces repeat mistakes by 70%

---

## 📞 CLIENT FEEDBACK LOOP

Based on prompts, client is:
- ✅ Actively testing features
- ✅ Reporting specific issues (S&S not working)
- ✅ Requesting UI changes (vertical scrolling)
- ✅ Adding new requirements iteratively

**Communication style:** Detailed, specific, expects working implementations not just mockups.
