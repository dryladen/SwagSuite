# 🗺️ OMS Feature Map: How Everything Connects

This document explains every existing feature in PromoEngine and how it relates to the central **Order Management System (OMS)**.

---

## ❓ The Big Question: Orders vs. Production Report

You asked: _"Are they related? What is the difference?"_

**Answer:** Yes, they are deeply related. Think of them as **Two Views of the Same Journey**.

### 1. The "Orders" Feature (Sales View)

- **Target User:** Sales Reps & Account Managers.
- **Focus:** Managing the **Client Relationship** & **Money**.
- **Key Questions It Answers:**
  - "Has the client approved the quote?"
  - "Have they paid the invoice?"
  - "What is the total revenue?"
- **Workflow:** Lead → Quote → Sales Order → Paid → Closed.

### 2. The "Production Report" Feature (Execution View)

- **Target User:** Production Managers & CSRs.
- **Focus:** Managing the **Vendor** & **Logistics**.
- **Key Questions It Answers:**
  - "Did the factory confirm the PO?"
  - "Is the tracking number uploaded?"
  - "Will this arrive by the Event Date?"
- **Workflow:** Sales Order Booked → PO Placed → Proofing → Production → Shipping.

> **Analogy:**
>
> - **Orders** page is the **Menu** at a restaurant (Customer orders Nasi Goreng).
> - **Production Report** is the **Kitchen Ticket** (Chef sees: Fry rice, Add egg, Plate it).
> - **They are the same meal**, just seen from different perspectives.

---

## 🧩 Complete Feature Breakdown

Here is how every implemented feature fits into the OMS ecosystem.

### 🔴 Core OMS ( The Heart )

These features are mandatory for an order to exist.

| Feature               | Function                        | Relation to OMS                                                |
| :-------------------- | :------------------------------ | :------------------------------------------------------------- |
| **Orders**            | Creates Quotes & Sales Orders.  | **The Core**. This is where transaction records are born.      |
| **Products**          | Database of items (Mugs, Pens). | **The Ingredients**. You cannot make a Quote without Products. |
| **Companies / CRM**   | Database of Customers.          | **The Buyer**. Every Order must link to a Company.             |
| **Artwork**           | File management.                | **The Spec**. Stores logos/proofs attached to the Order.       |
| **Production Report** | Kanban board for execution.     | **The Engine**. Moves the order from "Sold" to "Delivered".    |

### 🟡 OMS Support ( The Helpers )

These features make the Core process faster or better.

| Feature              | Function                           | Relation to OMS                                                                                     |
| :------------------- | :--------------------------------- | :-------------------------------------------------------------------------------------------------- |
| **Universal Search** | Find anything quickly.             | **Navigation**. Shortcuts to find Order #123 or Client ABC.                                         |
| **Mockup Builder**   | Visual tool for logos on products. | **Sales Aid**. Helps sell the Quote faster.                                                         |
| **Presentations**    | AI-generated proposal decks.       | **Sales Aid**. Turns a Quote into a beautiful PDF/Link.                                             |
| **Integrations**     | Connects to Slack/S&S/HubSpot.     | **Automation**. S&S fetches product data so you don't type manually. Slack notifies you of updates. |
| **Settings**         | Configures margins, users.         | **Rules**. Defines how the OMS behaves (e.g., Min Margin 20%).                                      |

### 🟢 Peripheral Features ( Growth & Marketing )

These features feed the OMS (get new business) or keep it healthy, but aren't strictly "Order Processing".

| Feature              | Function                    | Relation to OMS                                                    |
| :------------------- | :-------------------------- | :----------------------------------------------------------------- |
| **Sequence Builder** | Email marketing automation. | **Lead Gen**. Generates _new_ leads that eventually become Orders. |
| **Newsletter**       | Bulk email tool.            | **Retention**. Keeps existing clients engaged so they order again. |
| **Knowledge Base**   | Internal wiki/docs.         | **Training**. Helps new employees learn how to use the OMS.        |
| **Pacman Game**      | Fun minigame.               | **None**. Just for fun/stress relief! 🍒                           |

---

## 🔄 The "Day One" Flow Visualization

1.  **Marketing/Sequence** → Finds a Lead.
2.  **CRM** → Lead becomes a Contact.
3.  **Products** → Sales Rep finds a Mug using S&S Search.
4.  **Orders (Sales View)** → Rep builds a Quote & sends to Client.
5.  **Orders (Sales View)** → Client Approves → Becomes Sales Order.
6.  **Artwork** → Designer uploads Proof.
7.  **Production Report (Kitchen View)** → CSR sends PO to Vendor & tracks shipping.
8.  **Orders** → Mark as Closed/Delivered.
