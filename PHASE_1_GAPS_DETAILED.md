# Phase 1 / Day 1 - Critical Gaps Report

**Date**: December 28, 2025  
**Status**: ⚠️ Missing Core CRUD Operations

---

## 🔴 CRITICAL: Basic CRUD Missing

### 1. **PRODUCTS - NO EDIT FUNCTIONALITY** ❌

**Current State:**
- ✅ Can CREATE product (Add Product button works)
- ✅ Can VIEW product details (View Details modal)
- ✅ Can DELETE product
- ❌ **CANNOT EDIT product at all**

**What's Missing:**
```tsx
// NO EDIT BUTTON in products.tsx
// NO ProductEditModal component
// NO update product mutation
```

**Impact**: 
- Cannot update product prices when vendor changes pricing
- Cannot fix typos in product name/description
- Cannot update colors/sizes/SKU
- Cannot change supplier assignment
- **This is CRITICAL for daily operations**

**Database Support**: ✅ `PATCH /api/products/:id` endpoint exists in server/routes.ts

**Required Actions:**
1. Add "Edit" button next to Delete button in product card
2. Create ProductEditModal or reuse ProductModal with edit mode
3. Wire up to existing PATCH endpoint
4. Show toast confirmation on success

**Estimated Effort**: 2-3 hours

---

### 2. **ORDERS - MISSING VENDOR/SUPPLIER FIELDS** ❌

**Current State:**
- ✅ Can create order with customer, dates, addresses, notes
- ✅ Can add shipping/billing address
- ❌ **No way to assign vendor/supplier to order**
- ❌ **Tracking number field exists in DB but not in UI**

**What's Missing:**

#### A. No Vendor/Supplier Assignment
```typescript
// orders table DOES NOT HAVE supplierId field
// orderItems table DOES NOT HAVE supplierId field
// Production report shows "assigned vendor" but data doesn't exist
```

**Problem**: When you create PO or assign production, there's no field to say "this order goes to S&S Activewear" or "this order goes to SanMar"

**Where It Should Appear:**
- Order creation form (select vendor for whole order)
- Order item level (each product can have different vendor)
- Production report (show which vendor is handling each order)

#### B. Tracking Number Not Editable
```typescript
// trackingNumber field EXISTS in orders table ✅
// But NOT in OrderModal form ❌
// NOT editable in orders table ❌
// Shows in production report but can't be edited ❌
```

**Required Schema Changes:**
```sql
-- Option 1: Order-level vendor (simple)
ALTER TABLE orders ADD COLUMN supplier_id VARCHAR REFERENCES suppliers(id);

-- Option 2: Item-level vendor (more flexible)
ALTER TABLE order_items ADD COLUMN supplier_id VARCHAR REFERENCES suppliers(id);

-- Both options should work, Option 2 is more accurate for real workflow
```

**Required UI Changes:**
1. **OrderModal.tsx** - Add fields:
   - Supplier/Vendor selector (dropdown from /api/suppliers)
   - Tracking Number input field
   - PO Number field
   
2. **orders.tsx table** - Add columns:
   - Assigned Vendor column
   - Tracking Number column (with inline edit)

3. **Production Report** - Add edit capability:
   - Edit tracking number inline
   - Change assigned vendor
   - Update PO details

**Estimated Effort**: 4-6 hours (includes schema migration)

---

### 3. **ORDER MODAL - INCOMPLETE FOR PHASE 1** ⚠️

**Current Form Fields:**
✅ Customer selection
✅ Order type (quote/sales_order/rush_order)
✅ In-hands date
✅ Event date
✅ Shipping address
✅ Billing address
✅ Notes
✅ Artwork upload placeholder (UI only, doesn't work)

**Missing Required Fields:**

#### A. Financial Fields
```typescript
// These exist in DB but not in form:
- subtotal (calculated from items)
- tax (manual or calculated)
- shipping cost (manual input)
- total (calculated)
- margin % (manual input)
```

**Where**: Should be in OrderModal after adding items

#### B. Vendor/Production Fields
```typescript
- supplierId / assignedVendor (NEW FIELD NEEDED)
- trackingNumber
- currentStage (defaults to 'sales-booked', but should be visible)
- supplierInHandsDate (when vendor needs it by)
```

#### C. Item Selection
```typescript
// Currently NO WAY to add products to order in OrderModal
// Order items should be added during creation, not after
```

**Current Workflow Problem:**
1. User creates order → Only has customer + dates
2. User must go to order detail page → Add items manually
3. User cannot see pricing during order creation
4. User cannot select vendor during order creation

**Better Workflow:**
1. User creates order → Select customer + dates
2. **Add products** → Search/select from products, set quantity, price
3. **Assign vendor** → Select which supplier will fulfill
4. **Review totals** → See subtotal, tax, shipping, total
5. Save → Order is complete and ready for production

**Estimated Effort**: 6-8 hours

---

### 4. **PRODUCTION REPORT - DATA NOT PERSISTING** ⚠️

**Current Issues:**

#### A. Stage Data JSONB Not Being Used Properly
```typescript
// Code reads order.stageData but it's empty JSONB by default
// When user sets "next action date", it doesn't save properly
// Custom notes per stage not persisting
```

**Problem Code (production-report.tsx line ~144):**
```typescript
nextActionDate: order.stageData?.nextActionDate,  // ❌ undefined
nextActionNotes: order.customNotes?.nextAction,   // ❌ undefined
trackingNumber: order.trackingNumber,             // ❌ not editable
```

**Solution Needed:**
- Mutation to update `stageData` JSONB when user clicks "Set Next Action"
- Mutation to update `customNotes` JSONB for stage-specific notes
- Mutation to update `trackingNumber` inline

#### B. Assigned User Not Showing Real Names
```typescript
assignedTo: order.assignedUserId ? 'Team Member' : undefined,
// ❌ Just shows generic "Team Member"
```

**Solution**: Join with users table to get actual name

#### C. No Way to Move Orders Between Stages
```typescript
// Drag and drop not implemented
// No "Move to Next Stage" button
// currentStage field exists but no UI to change it
```

**Required Actions:**
1. Add PATCH endpoint to update stage: `PATCH /api/orders/:id/stage`
2. Add inline edit for tracking number
3. Add "Move to Stage" dropdown on each card
4. Add "Set Next Action" modal that actually saves data
5. Fix assignedTo to show real user names from /api/users

**Estimated Effort**: 8-10 hours

---

## 📊 Database Schema Gaps

### Missing Fields in `orders` Table:
```sql
-- Currently MISSING:
supplierId VARCHAR REFERENCES suppliers(id)  -- ❌ CRITICAL
poNumber VARCHAR                              -- ⚠️ Nice to have
vendorConfirmationDate TIMESTAMP             -- ⚠️ Nice to have
estimatedShipDate TIMESTAMP                  -- ⚠️ Nice to have

-- Fields that EXIST but not used in UI:
trackingNumber VARCHAR                        -- ✅ Exists, need UI
currentStage VARCHAR                         -- ✅ Exists, need UI
stageData JSONB                              -- ✅ Exists, not persisting
customNotes JSONB                            -- ✅ Exists, not persisting
```

### Missing Fields in `order_items` Table:
```sql
-- Currently MISSING:
supplierId VARCHAR REFERENCES suppliers(id)  -- ⚠️ Optional (item-level vendor)
vendorPrice DECIMAL(10,2)                    -- ⚠️ Nice to have
vendorSku VARCHAR                            -- ⚠️ Nice to have
```

---

## 📋 Phase 1 Priority Matrix

### Tier 1: MUST FIX (Blocks Daily Operations)
| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| Product Edit Missing | HIGH | 2-3h | 🔴 P0 |
| Order Vendor Assignment | HIGH | 4-6h | 🔴 P0 |
| Tracking Number UI | HIGH | 2h | 🔴 P0 |
| Production Stage Updates | HIGH | 8-10h | 🔴 P0 |

**Total Tier 1 Effort**: 16-21 hours (~2-3 days)

### Tier 2: SHOULD FIX (Improve UX)
| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| Order Modal - Add Items | MEDIUM | 6-8h | 🟡 P1 |
| Financial Fields in Order | MEDIUM | 3-4h | 🟡 P1 |
| Real User Names in Production | LOW | 1-2h | 🟡 P1 |

**Total Tier 2 Effort**: 10-14 hours (~1-2 days)

### Tier 3: NICE TO HAVE
| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| PO Number field | LOW | 1h | 🟢 P2 |
| Vendor confirmation tracking | LOW | 2-3h | 🟢 P2 |
| Estimated ship date | LOW | 1h | 🟢 P2 |

---

## 🎯 Recommended Fix Order

### Day 1 (8 hours):
1. ✅ **Product Edit** (2-3h) - Add edit button + modal
2. ✅ **Tracking Number UI** (2h) - Add to OrderModal + orders table
3. ✅ **Order Vendor Field** (4h) - Add supplierId to orders schema + UI

### Day 2 (8 hours):
4. ✅ **Production Stage Updates** (8h) - Fix data persistence + stage movement

### Day 3 (6 hours):
5. ✅ **Order Modal Items** (6h) - Add product selection to order creation

**Total**: 22 hours = 3 days for full Phase 1 CRUD completeness

---

## 🔍 How User Currently Works (Workaround)

### Creating an Order:
1. ✅ Click "New Order" → Fill customer, dates, addresses
2. ❌ **Cannot select vendor** → Must remember manually
3. ❌ **Cannot add products yet** → Order created empty
4. Go to order detail page → Add items one by one
5. ❌ **Cannot see vendor for each item** → Guessing
6. ❌ **No tracking number field** → Must add in notes

### Editing a Product:
1. ❌ **Cannot edit product** → Must delete and recreate
2. If price changes from vendor → Must delete product + re-add
3. If SKU typo → Must delete + re-add

### Production Tracking:
1. Change order status manually
2. ❌ **Cannot set tracking number** → Write in notes
3. ❌ **Cannot assign vendor** → Write in notes
4. ❌ **Next action doesn't save** → Write in notes
5. Everything is in "notes" field → Not structured data

**Result**: Heavy reliance on unstructured "notes" field instead of proper database fields.

---

## ✅ What IS Working Well

1. ✅ **Order creation** - Basic flow works
2. ✅ **S&S Activewear integration** - Product lookup functional
3. ✅ **Dashboard stats** - Revenue, margins calculate correctly
4. ✅ **Company/Contact CRUD** - All operations work
5. ✅ **Supplier management** - Can add/edit suppliers
6. ✅ **Order status changes** - Dropdown works, saves to DB
7. ✅ **Search functionality** - Universal search works
8. ✅ **Production stages** - Visual board displays correctly

---

## 📝 Conclusion

**Current Phase 1 Readiness**: 60% ⚠️

**Gaps Summary:**
- 🔴 **Product Edit**: Completely missing
- 🔴 **Vendor Assignment**: No database field
- 🔴 **Tracking Number**: Field exists, no UI
- 🔴 **Production Updates**: Not persisting data
- 🟡 **Order Items**: Cannot add during creation
- 🟡 **Financial Fields**: Not in order form

**Recommendation**: Fix Tier 1 items (2-3 days) before considering Phase 1 complete.

Without these fixes, users will rely heavily on workarounds and unstructured notes, defeating the purpose of having an OMS.
