# Third-Party Integrations Analysis for SwagSuite OMS

**Document Purpose:** This document provides a comprehensive analysis of potential third-party integrations for the SwagSuite Order Management System, including what each service offers, integration requirements, and how they align with project requirements.

**Date:** January 9, 2026

---

## Table of Contents

1. [QuickBooks Integration](#1-quickbooks-integration)
2. [SanMar Integration](#2-sanmar-integration)
3. [Stripe Integration](#3-stripe-integration)
4. [TaxJar Integration](#4-taxjar-integration)
5. [Summary & Recommendations](#5-summary--recommendations)

---

## 1. QuickBooks Integration

### Overview

QuickBooks is a comprehensive accounting software developed by Intuit, offering features for invoicing, expense tracking, payroll, and financial reporting. The QuickBooks Online API allows third-party applications to sync financial data bi-directionally.

### What I Understand

- **API Type:** RESTful API with OAuth 2.0 authentication
- **Sandbox Environment:** Intuit provides a sandbox QuickBooks Online company for development and testing
- **Authentication Flow:** 3-step integration process:
  1. Create account on Intuit Developer portal
  2. Create an app to get Client ID and Client Secret
  3. Generate OAuth tokens (access token expires every 60 minutes, refresh token needed for renewal)
- **SDKs Available:** Official SDKs for Node.js, Java, PHP, Python, Ruby, .NET

### Integration Requirements

| Requirement | Details |
|-------------|---------|
| **Developer Account** | Register at [developer.intuit.com](https://developer.intuit.com) |
| **App Registration** | Create app in developer portal to obtain API keys |
| **OAuth 2.0 Setup** | Implement OAuth flow for secure token management |
| **API Keys** | Client ID + Client Secret from "Keys & OAuth" tab |
| **Webhook Implementation** | For real-time sync (optional but recommended) |
| **Token Storage** | Secure storage for access/refresh tokens |

### Relevant Features for SwagSuite

Based on the project requirements from PROMP.md, QuickBooks integration would support:

| SwagSuite Feature | QuickBooks Capability | Priority |
|-------------------|----------------------|----------|
| **Invoicing Dashboard** | Sync invoice data (amounts owed, 60/90 day aging) | 🔴 High |
| **Revenue Tracking** | Pull revenue data for YTD, MTD, custom dates | 🔴 High |
| **Customer Sync** | Sync customer financial data with CRM | 🟡 Medium |
| **Order Revenue** | Track order revenue and payment status | 🔴 High |
| **Margin Calculation** | Import cost data for margin % calculations | 🟡 Medium |
| **Weekly Reports** | Pull financial metrics for automated email reports | 🔴 High |

### Specific Integration Points

1. **Invoicing Module:**
   - Track "how much owed, how much over 60 days, 90 days or custom date range"
   - Sync invoice payment status
   - Auto-generate invoices from Sales Orders

2. **Dashboard KPIs:**
   - Revenue (YTD, MTD, WTD, Custom)
   - Margin %
   - Order Revenue avg

3. **Customer Financial Data:**
   - Track customer spend and YTD totals on customer pages

### Questions to Clarify

- **Payment vs Account Integration:** Does the client need payment processing through QuickBooks, or just accounting/invoicing sync?
- **Account Credentials:** Does the client have an existing QuickBooks account, or do we need to set up a new one for testing?

---

## 2. SanMar Integration

### Overview

SanMar is a major wholesale apparel supplier in the promotional products industry. They provide SOAP-based web services for product information, inventory, pricing, and order management.

### What I Understand

- **API Type:** SOAP Web Services (XML-based)
- **Authentication:** Username/Password-based authentication per request
- **Services Available:**
  - **Inventory Service** - Real-time stock levels
  - **PO/POPSI Service** - Purchase Order submission and status
  - **Pricing Service** - Product pricing and price breaks
  - **Product Info Service** - Product details, colors, sizes, images
  - **Invoice Service** - Retrieve invoice data
  - **Packing Slip Service** - Shipping/packing documentation
  - **Days In Transit Service** - Shipping time estimates

### Integration Requirements

| Requirement | Details |
|-------------|---------|
| **SanMar Account** | Distributor account with web services access |
| **Account Number** | Required for API authentication |
| **Credentials** | Username + Password for web service calls |
| **SOAP Client** | Node.js SOAP library implementation |
| **WSDL Files** | Available at `ws.sanmar.com:8080/SanMarWebService/` |

### WSDL Endpoints

```
Base URL: https://ws.sanmar.com:8080/SanMarWebService/

- SanMarWebServicePort.xml          (Inventory)
- SanMarPOServicePort.xml           (Purchase Orders)
- SanMarPricingServicePort.xml      (Pricing)
- SanMarProductInfoServicePort.xml  (Product Details)
- InvoicePort.xml                   (Invoices)
- PackingSlipService.xml            (Packing Slips)
- InventoryDaysInTransitWSPort.xml  (Transit Times)
```

### Relevant Features for SwagSuite

Based on the project requirements from PROMP.md:

| SwagSuite Feature | SanMar Capability | Priority |
|-------------------|-------------------|----------|
| **Products Page** | Import product details, images, pricing | 🔴 High |
| **Most Popular Items** | Pull product data with images for apparel section | 🔴 High |
| **Mock-up Builder** | Get product images for mockup generation | 🔴 High |
| **Inventory Check** | Real-time stock availability | 🔴 High |
| **Purchase Orders** | Submit POs directly to SanMar | 🔴 High |
| **AI Search** | Search SanMar catalog for product recommendations | 🟡 Medium |
| **Vendor Management** | Track YTD spend with SanMar | 🟡 Medium |

### Specific Integration Points

1. **Products Module:**
   - "Allow products to be imported from S&S Activewear using their API Key" (similar workflow for SanMar)
   - Product search and details display
   - Pricing structure display

2. **Orders Module:**
   - "Products to come in from ESP API" - SanMar as additional source
   - Automated PO submission
   - Order confirmation tracking

3. **Dashboard:**
   - "Allow for that item to be clicked into to see all the data coming from the integrations with our vendors S&S, SanMar, ESP, Sage, etc."

---

## 3. Stripe Integration

### Overview

Stripe is a comprehensive payment processing platform that enables online payment acceptance, subscription management, invoicing, and marketplace payments. It offers a modern, developer-friendly RESTful API.

### What I Understand

- **API Type:** RESTful API with JSON responses
- **Authentication:** API Key-based (test keys: `sk_test_*`, live keys: `sk_live_*`)
- **Test Mode:** Separate test environment that doesn't affect live transactions
- **SDKs Available:** Ruby, Python, PHP, Java, Node.js, Go, .NET
- **Key Products:**
  - **Payments** - Accept one-time payments
  - **Billing** - Subscription and recurring payments
  - **Invoicing** - Create and manage invoices
  - **Connect** - Marketplace/platform payments

### Integration Requirements

| Requirement | Details |
|-------------|---------|
| **Stripe Account** | Create account at [stripe.com](https://stripe.com) |
| **API Keys** | Publishable + Secret keys from Dashboard |
| **Webhooks** | For real-time payment event notifications |
| **PCI Compliance** | Stripe handles PCI compliance via Elements/Checkout |
| **Node.js SDK** | `npm install stripe` |

### Relevant Features for SwagSuite

Based on the project requirements from PROMP.md:

| SwagSuite Feature | Stripe Capability | Priority |
|-------------------|-------------------|----------|
| **Invoice Payment** | Accept payment for invoices | 🔴 High |
| **Sales Order Payment** | Collect payment when customer approves order | 🔴 High |
| **Production Tracking** | Track "invoice paid by customer" stage | 🔴 High |
| **Store Payments** | Payment processing for customer stores | 🔴 High |
| **Weekly Revenue Reports** | Transaction data for automated reports | 🟡 Medium |
| **Dashboard Finances** | Revenue tracking and payment analytics | 🟡 Medium |

### Specific Integration Points

1. **Sales Orders:**
   - "Sales orders will be sent to the client for approval. When an approval comes back as positive..."
   - Payment collection on order approval
   - Payment status tracking

2. **Production Report:**
   - "Invoice paid by customer" as a production stage
   - Real-time payment confirmation

3. **Invoicing:**
   - Generate Stripe Invoices or integrate with QuickBooks invoices
   - Payment link generation
   - Automatic payment reminders

4. **Dashboard:**
   - Revenue metrics (YTD, MTD, etc.)
   - Payment status overview

### Stripe vs QuickBooks for Payments

| Aspect | Stripe | QuickBooks |
|--------|--------|------------|
| **Primary Use** | Payment processing | Accounting/Invoicing |
| **Real-time** | Yes | Yes |
| **Payment Methods** | 40+ methods | Limited |
| **Developer Experience** | Modern API | Traditional API |
| **Recommendation** | Use for payments | Use for accounting sync |

**Recommended Approach:** Use Stripe for payment processing, sync payment data to QuickBooks for accounting.

---

## 4. TaxJar Integration

### Overview

TaxJar is a sales tax calculation and compliance service. It provides real-time tax calculation based on product type, nexus (business presence), and destination, plus automated tax filing.

### What I Understand

- **API Type:** RESTful API with JSON responses
- **Authentication:** Bearer Token (API key)
- **Key Features:**
  - Real-time tax calculation by jurisdiction
  - Product tax codes for exemptions (e.g., clothing in NY)
  - Nexus determination (where you have tax obligation)
  - Transaction recording for tax reporting
  - Multi-state/international support
- **SDKs Available:** Ruby, Python, PHP, Node.js, C#/.NET, Java, Go

### Integration Requirements

| Requirement | Details |
|-------------|---------|
| **TaxJar Account** | Sign up at [taxjar.com](https://www.taxjar.com) |
| **API Token** | From TaxJar account dashboard |
| **Nexus Addresses** | Configure business locations |
| **Product Tax Codes** | Map product categories to tax codes |
| **TLS 1.2** | Required for all API requests |

### Key API Endpoints

```javascript
// Tax Calculation
POST https://api.taxjar.com/v2/taxes

// Required Parameters:
{
  "to_city": "destination city",
  "to_state": "destination state",
  "to_zip": "destination zip",
  "to_country": "destination country",
  "from_city": "origin city",  
  "from_state": "origin state",
  "from_zip": "origin zip",
  "from_country": "origin country",
  "shipping": 7.99,
  "line_items": [
    {
      "quantity": 1,
      "unit_price": 19.99,
      "product_tax_code": "20010"  // Optional, for exemptions
    }
  ]
}
```

### Relevant Features for SwagSuite

Based on the project requirements from PROMP.md:

| SwagSuite Feature | TaxJar Capability | Priority |
|-------------------|-------------------|----------|
| **Sales Orders** | Calculate sales tax on orders | 🔴 High |
| **Quotes** | Include accurate tax in quotes | 🔴 High |
| **Invoicing** | Correct tax on invoices | 🔴 High |
| **Multi-State Orders** | Handle different tax jurisdictions | 🔴 High |
| **Product Categories** | Apparel tax exemptions (some states) | 🟡 Medium |
| **Margin Calculation** | Accurate total for margin % | 🟡 Medium |

### Specific Integration Points

1. **Quotes Module:**
   - Calculate tax when creating quotes for clients
   - Show tax breakdown by jurisdiction

2. **Sales Orders:**
   - Real-time tax calculation on order creation
   - Support for multiple shipping addresses
   - Handle product-specific tax rules

3. **Invoicing:**
   - Accurate tax on invoices
   - Support for tax-exempt customers
   - Integration with QuickBooks for tax reporting

4. **Apparel-Specific Rules:**
   - Clothing exemptions in states like NY (under $110)
   - Product tax code: `20010` for clothing items

---

## 5. Summary & Recommendations

### Integration Priority Matrix

| Integration | Business Value | Technical Effort | Priority |
|-------------|---------------|------------------|----------|
| **Stripe** | 🔴 High - Core payment processing | 🟢 Low - Modern API | **P0** |
| **QuickBooks** | 🔴 High - Financial tracking & invoicing | 🟡 Medium - OAuth complexity | **P0** |
| **TaxJar** | 🔴 High - Tax compliance required | 🟢 Low - Simple REST API | **P1** |
| **SanMar** | 🔴 High - Major apparel supplier | 🔴 High - SOAP complexity | **P1** |

### Recommended Integration Order

1. **Phase 1: Payment & Accounting Foundation**
   - Stripe (payment processing)
   - QuickBooks (invoicing & accounting sync)

2. **Phase 2: Compliance & Tax**
   - TaxJar (sales tax calculation)

3. **Phase 3: Supplier Expansion**
   - SanMar (additional apparel supplier alongside S&S)

### Feature Mapping Summary

| Project Requirement (from PROMP.md) | Supported By |
|-------------------------------------|--------------|
| Dashboard - Revenue tracking | QuickBooks, Stripe |
| Dashboard - Invoicing status | QuickBooks |
| Sales Orders - Payment collection | Stripe |
| Sales Orders - Tax calculation | TaxJar |
| Production Report - Payment tracking | Stripe |
| Products - Apparel catalog | SanMar |
| Products - Purchase orders | SanMar |
| Weekly Reports - Revenue data | QuickBooks, Stripe |
| Margin % calculation | QuickBooks |

### Required Information from Client

| Service | Information Needed |
|---------|-------------------|
| **QuickBooks** | 1. Existing QuickBooks account? <br> 2. Payment processing via QB or just accounting sync? |
| **SanMar** | 1. SanMar distributor account number <br> 2. Web services credentials |
| **Stripe** | 1. Stripe account (or create new?) <br> 2. Business verification documents |
| **TaxJar** | 1. States where business has nexus <br> 2. Product categories sold |

### Current Integration Status

| Integration | Current Status | Action Needed |
|-------------|---------------|---------------|
| S&S Activewear | ✅ Implemented | Working |
| Slack | ✅ Implemented | Working |
| SendGrid | ✅ Implemented | Working |
| HubSpot | ⚙️ Mock | Real implementation needed |
| SAGE | ⚙️ Mock | Real implementation needed |
| ESP | ⚙️ Mock | Real implementation needed |
| **QuickBooks** | ❌ Missing | New implementation |
| **Stripe** | ❌ Missing | New implementation |
| **SanMar** | ❌ Missing | New implementation |
| **TaxJar** | ❌ Missing | New implementation |

---

## Technical Implementation Notes

### Environment Variables Needed

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# QuickBooks
QUICKBOOKS_CLIENT_ID=...
QUICKBOOKS_CLIENT_SECRET=...
QUICKBOOKS_REALM_ID=...
QUICKBOOKS_REDIRECT_URI=...

# TaxJar
TAXJAR_API_KEY=...

# SanMar
SANMAR_ACCOUNT_NUMBER=...
SANMAR_USERNAME=...
SANMAR_PASSWORD=...
```

### Suggested npm Packages

```json
{
  "dependencies": {
    "stripe": "^14.x",
    "intuit-oauth": "^4.x",
    "taxjar": "^4.x",
    "soap": "^1.x"
  }
}
```

---

*Document prepared for project planning and client communication.*
