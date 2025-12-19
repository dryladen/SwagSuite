# 🏗️ OMS Implementation Gap Analysis (Notion Export)

> 💡 **How to use this in Notion:**
> Copy and paste the tables below directly into a Notion page. They will automatically format. You can also turn the tables into a "Notion Database" to track progress.

---

## 📌 Legend & Status

- ✅ **Implemented**: Code and logic exists.
- ⚠️ **Partial / Mocked**: UI exists but backend is fake/manual.
- ❌ **Missing**: No code exists.

---

## 1. Sales & Ordering Flow

| Step | Workflow Action                 | Status         | Technical Reality & Gaps                                            | Priority   |
| :--- | :------------------------------ | :------------- | :------------------------------------------------------------------ | :--------- |
| 1    | Sales Rep creates "Quote"       | ✅ Implemented | `orders` table supports quote type.                                 | Low        |
| 2    | Sales Rep sends Quote to Client | ⚠️ Manual Only | **Gap**: No auto-email. Rep must download PDF/Screenshot.           | High       |
| 3    | **Client approves Quote**       | ❌ Missing     | **Critical**: No public link/portal for clients to click "Approve". | **Urgent** |
| 4    | Convert Quote to "Sales Order"  | ✅ Implemented | Backend status update exists.                                       | Low        |
| 5    | Send SO for Approval            | ⚠️ Manual Only | No email trigger logic in `routes.ts`.                              | High       |
| 6    | **Client approves Sales Order** | ❌ Missing     | No public interface for client signature/payment.                   | **Urgent** |
| 7    | Notify Production Team          | ⚠️ Log Only    | Only logs to database. No Slack/Email alert sent.                   | Medium     |

## 2. Financial & Procurement Flow

| Step | Workflow Action            | Status     | Technical Reality & Gaps                                                                      | Priority   |
| :--- | :------------------------- | :--------- | :-------------------------------------------------------------------------------------------- | :--------- |
| 8    | System marks "Invoiced"    | ⚠️ UI Only | Status exists, but no Invoice PDF generation.                                                 | Medium     |
| 9    | **Client submits Payment** | ❌ Missing | **Critical**: No Stripe integration or Payment page.                                          | **Urgent** |
| 10   | Update status to "Paid"    | ✅ Manual  | Manual toggle by admin.                                                                       | Low        |
| 11   | **Set Vendor PO**          | ❌ Missing | **Critical**: No `purchase_orders` table in DB. Cannot separate Client Order vs Vendor Order. | **Urgent** |
| 12   | Send PO to Vendor          | ⚠️ Manual  | No "Email Vendor" button.                                                                     | Medium     |

## 3. Proofing & Critical Loop

| Step | Workflow Action            | Status         | Technical Reality & Gaps                            | Priority   |
| :--- | :------------------------- | :------------- | :-------------------------------------------------- | :--------- |
| 14   | Vendor sends Proof         | ⚠️ External    | Happens in external email.                          | Low        |
| 15   | Assign "Internal Proofing" | ⚠️ Chat Ops    | Done via comments/@mentions. No Task system.        | Low        |
| 16   | Upload "Client Proof"      | ✅ Implemented | `artworkFiles` upload works.                        | Low        |
| 17   | **Send Proof to Client**   | ❌ Missing     | **Gap**: No automation. Must act manually.          | High       |
| 18   | **Client Review Loop**     | ❌ Missing     | **Critical**: Client cannot comment/approve online. | **Urgent** |
| 19   | Final Fab Approval         | ⚠️ Manual      | Manual email to vendor.                             | Low        |

## 4. Fulfillment & Closing

| Step | Workflow Action             | Status         | Technical Reality & Gaps                                      | Priority |
| :--- | :-------------------------- | :------------- | :------------------------------------------------------------ | :------- |
| 21   | Vendor ships (Tracking)     | ⚠️ External    | Vendor emails tracking manually.                              | Low      |
| 22   | Enter Tracking Info         | ✅ Implemented | Field exists in DB.                                           | Low      |
| 23   | **Notify Client "Shipped"** | ❌ Missing     | **Gap**: No auto-email or SMS.                                | High     |
| 24   | Update "Delivered"          | ❌ Manual      | No FedEx/UPS tracking API integration.                        | Medium   |
| 25   | **Request Review**          | ⚠️ Manual      | Sequence Builder UI exists, but no backend engine to send it. | High     |

---

## 🛠️ Technical Action Items (To-Do List)

Checking these off will move the system from **Prototype** to **Production**.

- [ ] **Build "Mailer Engine"** (Integrate SendGrid/Resend to actually send emails)
- [ ] **Build "Public Client Portal"** (Unique URL per order for clients to view/approve)
- [ ] **Create `purchase_orders` Table** (Separate Vendor POs from Sales Orders)
- [ ] **Connect Stripe** (Allow credit card payments on the Portal)
- [ ] **Build "Cron Scheduler"** (To run automated checks for Shipping & Reviews)
