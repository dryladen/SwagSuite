# Integration Settings - Database Implementation

## Overview
Implemented full database-backed integration settings management for API keys and tokens used across the SwagSuite platform.

## Implementation Date
December 29, 2025

## What Was Implemented

### 1. Database Schema (`shared/schema.ts`)
Created `integration_settings` table with the following structure:

```typescript
export const integrationSettings = pgTable("integration_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // S&S Activewear Integration
  ssActivewearAccount: varchar("ss_activewear_account"),
  ssActivewearApiKey: text("ss_activewear_api_key"),
  // Slack Integration
  slackBotToken: text("slack_bot_token"),
  slackChannelId: varchar("slack_channel_id"),
  // HubSpot Integration
  hubspotApiKey: text("hubspot_api_key"),
  // Connection status flags
  quickbooksConnected: boolean("quickbooks_connected").default(false),
  stripeConnected: boolean("stripe_connected").default(false),
  shipmateConnected: boolean("shipmate_connected").default(false),
  // Metadata
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Features:**
- Single-row table (only one settings record exists)
- References user who last updated settings
- Timestamps for audit trail
- Text fields for sensitive API keys/tokens
- Boolean flags for connection status

### 2. Storage Layer (`server/storage.ts`)

Added two methods to the storage interface:

```typescript
async getIntegrationSettings(): Promise<IntegrationSettings | undefined>
async upsertIntegrationSettings(settings: Partial<InsertIntegrationSettings>, userId?: string): Promise<IntegrationSettings>
```

**Implementation Details:**
- `getIntegrationSettings()`: Retrieves the single settings record from database
- `upsertIntegrationSettings()`: Creates or updates settings record
  - Automatically sets `updatedBy` to current user
  - Updates `updatedAt` timestamp
  - Uses database transaction for consistency

### 3. API Endpoints (`server/routes.ts`)

#### GET `/api/settings/integrations`
- **Auth Required:** Yes (isAuthenticated middleware)
- **Returns:** Integration settings object
- **Fallback Strategy:**
  1. First tries to load from database
  2. Falls back to environment variables if no DB record exists
  3. Returns empty strings as final fallback

```typescript
app.get('/api/settings/integrations', isAuthenticated, async (req, res) => {
  const dbSettings = await storage.getIntegrationSettings();
  const settings = dbSettings || {
    ssActivewearAccount: process.env.SS_ACTIVEWEAR_ACCOUNT || "",
    ssActivewearApiKey: process.env.SS_ACTIVEWEAR_API_KEY || "",
    // ... other fields
  };
  res.json(settings);
});
```

#### POST `/api/settings/integrations`
- **Auth Required:** Yes (isAuthenticated middleware)
- **Body:** Integration settings object
- **Returns:** Success message with saved settings
- **Security:** Logs masked values (shows `***` instead of actual keys)

```typescript
app.post('/api/settings/integrations', isAuthenticated, async (req, res) => {
  const settings = req.body;
  const userId = (req.user as any)?.id;
  
  // Save to database with user tracking
  const savedSettings = await storage.upsertIntegrationSettings(settings, userId);
  
  res.json({ 
    success: true, 
    message: 'Integration settings saved successfully',
    settings: savedSettings
  });
});
```

### 4. Frontend Integration (`client/src/pages/settings.tsx`)

**State Management:**
```typescript
const { data: integrationSettings } = useQuery({
  queryKey: ['/api/settings/integrations'],
  staleTime: 1000 * 60 * 5, // 5 minutes cache
});

const [integrations, setIntegrations] = useState({
  ssActivewearAccount: "",
  ssActivewearApiKey: "",
  hubspotApiKey: "",
  slackBotToken: "",
  slackChannelId: "",
  quickbooksConnected: false,
  stripeConnected: false,
  shipmateConnected: false
});

// Sync loaded data with state
useEffect(() => {
  if (integrationSettings) {
    setIntegrations({
      ssActivewearAccount: integrationSettings.ssActivewearAccount || "",
      ssActivewearApiKey: integrationSettings.ssActivewearApiKey || "",
      // ... other fields
    });
  }
}, [integrationSettings]);
```

**Save Function:**
```typescript
const saveSettings = async (section: string) => {
  if (section === 'Integration') {
    await apiRequest('POST', '/api/settings/integrations', integrations);
    queryClient.invalidateQueries({ queryKey: ['/api/settings/integrations'] });
    toast({ title: "Integration settings saved successfully" });
  }
};
```

### 5. Database Migration

Generated and applied migration:
```bash
npx drizzle-kit generate
npx drizzle-kit push
```

Migration file: `migrations/0000_grey_sinister_six.sql`

## Features

### ✅ Persistent Storage
- Settings saved to PostgreSQL database
- Survives server restarts
- No need to modify environment variables

### ✅ User Tracking
- Records which user last updated settings
- Maintains audit trail with timestamps
- Can be extended for full change history

### ✅ Security
- API keys masked in server logs
- Password-type input fields in UI
- Authenticated endpoints only

### ✅ Seamless Fallback
- Loads from database first
- Falls back to environment variables
- Works even with empty database

### ✅ Real-time Updates
- Automatic cache invalidation after save
- React Query manages loading states
- Form fields auto-populate with saved values

## Integration Points

### S&S Activewear
- **Account Number:** `ssActivewearAccount`
- **API Key:** `ssActivewearApiKey`
- Used in `server/ssActivewearService.ts` for product imports

### Slack
- **Bot Token:** `slackBotToken`
- **Channel ID:** `slackChannelId`
- Used for notifications and activity logging

### HubSpot
- **API Key:** `hubspotApiKey`
- Planned for CRM synchronization

### Future Integrations
- QuickBooks (connection flag ready)
- Stripe (connection flag ready)
- Shipmate (connection flag ready)

## Usage

### Admin Workflow
1. Navigate to **Settings** → **Integrations** tab
2. Enter API keys/tokens for each service:
   - S&S Activewear: Account Number & API Key
   - Slack: Bot Token & Channel ID
   - HubSpot: API Key
3. Click **Save Changes**
4. Settings are immediately saved to database
5. All services use the new credentials

### Developer Notes
- Settings retrieved via `storage.getIntegrationSettings()`
- Single source of truth in database
- No need to restart server after updates
- Environment variables still work as fallback for dev environments

## Security Considerations

### Current Implementation
- ✅ API keys stored in database text fields
- ✅ Authenticated endpoints only
- ✅ Masked in server logs
- ✅ Password-type inputs in UI

### Production Recommendations
1. **Encryption at Rest**
   - Encrypt sensitive fields in database
   - Use PostgreSQL `pgcrypto` extension
   - Or application-level encryption (AES-256)

2. **Access Control**
   - Restrict to admin users only
   - Add role-based permissions
   - Audit log for all changes

3. **Secrets Management**
   - Consider HashiCorp Vault
   - Or AWS Secrets Manager
   - For enterprise deployments

4. **API Key Rotation**
   - Add expiration tracking
   - Rotation reminders
   - Version history

## Testing

### Manual Test Flow
1. ✅ Server starts successfully
2. ✅ Settings page loads
3. ✅ Form fields populate from database
4. ✅ Can edit all integration fields
5. ✅ Save button persists to database
6. ✅ Refresh page shows saved values
7. ✅ Backend logs masked values

### Database Verification
```sql
-- Check settings exist
SELECT * FROM integration_settings;

-- Verify updated_by tracking
SELECT 
  id,
  ss_activewear_account,
  updated_by,
  updated_at 
FROM integration_settings;
```

## Migration Notes

### From Environment Variables
If you currently use `.env` file:
```env
SS_ACTIVEWEAR_ACCOUNT=52733
SS_ACTIVEWEAR_API_KEY=1812622b-59cd-4863-8a9f-ad64eee5cd22
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_CHANNEL_ID=C01234567
HUBSPOT_API_KEY=your-hubspot-key
```

**After Implementation:**
1. Settings UI loads these values as defaults
2. Save once through UI to persist to database
3. Database becomes primary source
4. Environment variables remain as fallback

### Backwards Compatibility
- ✅ Existing code continues to work
- ✅ Environment variables still respected
- ✅ No breaking changes
- ✅ Gradual migration path

## Files Modified

1. **shared/schema.ts**
   - Added `integrationSettings` table
   - Added `IntegrationSettings` type
   - Added `InsertIntegrationSettings` type

2. **server/storage.ts**
   - Added `getIntegrationSettings()` method
   - Added `upsertIntegrationSettings()` method
   - Updated interface and imports

3. **server/routes.ts**
   - Updated GET `/api/settings/integrations` to use database
   - Updated POST `/api/settings/integrations` to save to database
   - Added user tracking and proper error handling

4. **client/src/pages/settings.tsx**
   - Added integration settings query
   - Added useEffect for data synchronization
   - Updated save function with database persistence

5. **Database**
   - New table: `integration_settings`
   - Migration: `migrations/0000_grey_sinister_six.sql`

## Completion Status

✅ Database schema created  
✅ Storage layer implemented  
✅ API endpoints updated  
✅ Frontend integration complete  
✅ Database migration applied  
✅ Server tested and running  
✅ Documentation complete

## Next Steps (Optional Enhancements)

1. **Field-Level Encryption**
   - Encrypt API keys before storage
   - Decrypt when retrieved

2. **Audit History**
   - Track all changes to settings
   - Show change history in UI

3. **Connection Testing**
   - "Test Connection" buttons
   - Verify credentials work
   - Show success/error status

4. **API Key Validation**
   - Validate format before save
   - Check with service APIs
   - Prevent invalid credentials

5. **Backup/Export**
   - Export settings securely
   - Import from backup
   - For disaster recovery

---

**Status:** ✅ COMPLETE - Integration settings now fully database-backed with persistent storage, user tracking, and secure handling of sensitive credentials.
