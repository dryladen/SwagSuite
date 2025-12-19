# OMS Implementation Deep Dive: Flow, Logic & Gaps

This document provides a line-by-line analysis of the specified "Day One" workflows against the current Codebase State. It identifies exactly what is built, what is simulated (mocked), and what is missing.

> **Legend:**
>
> - ✅ **Implemented**: Code exists, database schema exists, and logic is functional.
> - ⚠️ **Partial / Mocked**: UI exists but backend returns fake data or requires manual triggers.
> - ❌ **Missing**: No code or database structure exists for this step.

---

## 1. Sales & Ordering Flow

| Step  | Workflow Action                 | Implementation Status | Technical Reality & Gaps                                                                                                                      |
| :---- | :------------------------------ | :-------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | Sales Rep creates "Quote"       |  ✅ **Implemented**   | `orders` table has `orderType: "quote"`. Products can be added via `orderItems`.                                                              |
| **2** | Sales Rep sends Quote to Client |  ⚠️ **Manual Only**   | **Gap**: No "Email Quote" button or PDF generator. Sales rep must currently screenshot/print the page manually.                               |
| **3** | _Client approves Quote_         |    ❌ **Missing**     | **Critical Gap**: No "Public Quote Page" (e.g., `domain.com/q/123`) exists. Clients cannot login or click a link to approve.                  |
| **4** | Convert Quote to "Sales Order"  |  ✅ **Implemented**   | Simple status update: `UPDATE orders SET status='sales_order'`.                                                                               |
| **5** | Send SO for Approval            |  ⚠️ **Manual Only**   | Same as Step 2. No automated email trigger found in `routes.ts`.                                                                              |
| **6** | _Client approves Sales Order_   |    ❌ **Missing**     | Same as Step 3. No mechanism for clients to perform this action digitally.                                                                    |
| **7** | Notify Production Team          |    ⚠️ **Log Only**    | **Gap**: Activity log (`activities` table) records the event, but **no real-time notification** (Slack/Email) is sent to the Production team. |

## 2. Financial & Procurement Flow

| Step   | Workflow Action          | Implementation Status | Technical Reality & Gaps                                                                                                                                                |
| :----- | :----------------------- | :-------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **8**  | System marks "Invoiced"  | ⚠️ **UI State Only**  | `orderStatusEnum` supports it, but there is no dedicated "Invoice" object or generation logic.                                                                          |
| **9**  | _Client submits Payment_ |    ❌ **Missing**     | **Critical Gap**: No Stripe/Credit Card integration. No "Payment Portal" page.                                                                                          |
| **10** | Update status to "Paid"  |     ✅ **Manual**     | Admin/Sales can manually toggle a status, but no auto-update from payment gateways.                                                                                     |
| **11** | Set Vendor PO            | ❌ **Missing Object** | **Critical Gap**: The `schema.ts` has **NO `purchase_orders` table**. Currently, you cannot separate "What we sold to client" (SO) from "What we buy from vendor" (PO). |
| **12** | Send PO to Vendor        |     ⚠️ **Manual**     | No "Email Vendor" button. Users must download data and email it outside the system.                                                                                     |
| **13** | Vendor confirms receipt  |  ⚠️ **Manual Note**   | User must manually add a comment/note to the Timeline.                                                                                                                  |

## 3. Proofing & Production Flow (The Critical Loop)

| Step   | Workflow Action            | Implementation Status | Technical Reality & Gaps                                                                                      |
| :----- | :------------------------- | :-------------------: | :------------------------------------------------------------------------------------------------------------ |
| **14** | Vendor sends Proof         |    ⚠️ **External**    | Happens via email outside the system. User must manually upload file to `artworkFiles`.                       |
| **15** | Assign "Internal Proofing" |    ⚠️ **Chat Ops**    | Done via `@mentions` in the Project Timeline (e.g., "@Designer Fix this"). No formal "Task Assignment" logic. |
| **16** | Upload "Client Proof"      |  ✅ **Implemented**   | `artworkFiles` table supports uploading and tagging files.                                                    |
| **17** | Send Proof to Client       |    ❌ **Missing**     | **Gap**: No one-click "Send Proof Email" logic. Must be done manually via Gmail/Outlook.                      |
| **18** | _Client Review Loop_       |    ❌ **Missing**     | **Critical Gap**: Clients have no interface to comment/approve proofs directly in the system.                 |
| **19** | Final Fab Approval         |     ⚠️ **Manual**     | User must manually email the vendor outside the system.                                                       |
| **20** | Vendor provides Dates      |  ⚠️ **Manual Data**   | User must manually edit the Order fields `supplierInHandsDate` in the settings tab.                           |

## 4. Fulfillment & Closing Flow

| Step   | Workflow Action         | Implementation Status | Technical Reality & Gaps                                                                                  |
| :----- | :---------------------- | :-------------------: | :-------------------------------------------------------------------------------------------------------- |
| **21** | Vendor ships            |    ⚠️ **External**    | Vendor emails tracking info to Sales Rep.                                                                 |
| **22** | Enter Tracking Info     |  ✅ **Implemented**   | Field `trackingNumber` exists in `orders` table.                                                          |
| **23** | Notify Client "Shipped" |    ❌ **Missing**     | **Gap**: No automated email trigger when `trackingNumber` is saved.                                       |
| **24** | Update "Delivered"      |     ❌ **Manual**     | No integration with FedEx/UPS APIs to auto-update status.                                                 |
| **25** | Request Review          |     ⚠️ **Manual**     | User must manually email client. The `Sequence Builder` UI exists but has no backend engine to send this. |
| **26** | Close Order             |  ✅ **Implemented**   | Simple status update.                                                                                     |

---

## 5. Technical Gap Summary (What needs to be built?)

To turn this **Prototype** into a **Working Product**, we need 4 Core "Engines":

1.  **The Mailer Engine**: A backend service (using SendGrid/Resend) to actually **Send Emails** (Quotes, Proofs, Notifications).
2.  **The Client Portal**: A public-facing, secure set of pages where clients can:
    - View Quotes/Invoices.
    - Click "Approve" / "Pay".
    - Comment on Proofs.
3.  **The Purchase Order Module**: A new database table (`purchase_orders`) to track orders sent to Vendors separately from Sales Orders.
4.  **The Automation Runner**: A background job (Cron) to auto-check tracking numbers and send "Review Requests" 5 days after delivery.
