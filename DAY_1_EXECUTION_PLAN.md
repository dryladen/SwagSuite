# 🚀 Day 1 Execution Plan: Critical Path to Launch

**Goal:** Turn "Day 1 Ready" from a concept into reality by closing the critical gaps identified in the audit.
**Strategy:** Weekly Sprints focusing on "Blockers" first.

---

## 🧭 Order Flow Verification: Is "Current" = "Client's Wish"?

**Observation:** The current system _technically_ supports the flow, but **manually**. The client wants **automation**.

| Step            | Client's Defined Flow (PROMP.md)           | Current System Reality                                     | **The Fix (Phase 1)**                  |
| :-------------- | :----------------------------------------- | :--------------------------------------------------------- | :------------------------------------- |
| **1. Quote**    | Create Quote -> Send Link to Client        | Create Quote -> **Download PDF -> Email Manually**         | **Auto-email "View Quote" Link**       |
| **2. Approval** | Client clicks "Approve" on Web Link        | Client replies to Email -> **Rep manually updates status** | **Client Portal (One-click Approval)** |
| **3. Order**    | Convert to Sales Order -> Production Board | **Same** (Convert button exists)                           | **Auto-move to "Production" on click** |
| **4. Proofing** | Upload Art -> Client Web Approval          | Upload Art -> **Email PDF -> Wait for Reply**              | **Proofing Tab in Portal**             |
| **5. Invoice**  | Auto-Invoice -> Client Pays Online         | **Manual QB Entry** -> **Wait for Cheque/Transfer**        | **Stripe/QuickBooks Integration**      |

> [!IMPORTANT] > **Conclusion:** The core "logic" is correct, but the **Client Interaction Layer** is missing. This Execution Plan builds that layer.

---

## 📅 Phase 1: The "Must-Haves" (Weeks 1-2)

_Focus: Security, Client-Facing Basics, and Money_

### 1. 🔐 Security First (2FA)

_Requirement: Section 9 - "Some integrations need to be in by Day 1 - Stripe, QB, ESP"_ (Implied security for payments)

- [ ] Install `speakeasy` or `otplib`
- [ ] Add `twoFactorSecret` column to `users` table
- [ ] Create UI: QR Code display in Settings
- [ ] Middleware: Enforce 2FA for 'admin' and 'finance' roles

### 2. 💳 Money Basics (Stripe & QuickBooks)

_Requirement: Section 6.10 & 8 - "Invoicing... Mark as Paid... Stripe/QB Day 1"_

- [ ] **Stripe**:
  - [ ] Install `stripe` SDK
  - [ ] Create `/api/payment-intent` route
  - [ ] Add "Pay Now" button to Sales Order/Invoice page
- [ ] **QuickBooks**:
  - [ ] Create `QuickBooksService` class
  - [ ] Implement One-way Sync (PromoEngine -> QB) for Invoices
  - [ ] OAuth2 handshake page in Settings

### 3. 🕸️ Client Approval Portal (The Missing Link)

_Requirement: Section 6.8 - "Working web link... client can click approve/decline... save as PDF"_

- [ ] **Public Routes**: Create `/portal/orders/:guid` (No login required, UUID protected)
- [ ] **UI**: Simple page showing Quote/Proof summary + "Approve" / "Decline" buttons
- [ ] **PDF**: Integrate `jspdf` or `puppeteer` to auto-generate PDF upon approval
- [ ] **Feedback**: Allow client to type comments if Declined

---

## 📅 Phase 2: The "Product Engine" (Weeks 3-4)

_Focus: Sourcing and Integrations_

### 4. 📦 ESP & SanMar Integration

_Requirement: Section 6.5 - "Need this from ESP on Day 1"_

- [ ] **ESP (ASI)**:
  - [ ] Create `EspService` (Soap/REST API wrapper)
  - [ ] Implement `searchProducts(keyword)`
  - [ ] Implement `getProductDetail(id)` -> Import to local DB
- [ ] **SanMar**:
  - [ ] Same structure as S&S activewear service
  - [ ] Map SanMar generic colors to local standard colors

### 5. 📧 Email Automation Engine (SendGrid)

_Requirement: Section 6.8 & 6.11 - "Send proof to client... Notify client of tracking"_

- [ ] Integrate SendGrid/Resend API
- [ ] **Triggers**:
  - [ ] Quote Created -> Email "View Quote" Link
  - [ ] Proof Ready -> Email "Action Required" Link
  - [ ] Order Shipped -> Email Tracking Info

---

## 📅 Phase 3: Polish & Manual Workflows (Week 5)

_Focus: Clean up and Non-Critical Features_

- [ ] **Bulk Import**: CSV uploaders for Contacts/Vendors (Section 6.2)
- [ ] **Dashboard Cleanup**: Hide "Mock" data, show real Real-time stats
- [ ] **Final QA**: Walkthrough of the "Golden Path" (Order -> Source -> Pay -> Ship)

---

## 🛠️ Immediate Next Steps (Day 0 - Today)

1.  **Select ONE Priority**: I recommend starting with **Client Approval Portal** because it affects the most workflows.
2.  **Confirm Credentials**: We need ESP, Stripe, and SendGrid API keys to start dev.
