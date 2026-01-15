# Replit Object Storage Implementation Guide

## Overview
Implementasi Replit Object Storage untuk handle file uploads, email attachments, dan file management di SwagSuite.

## Installation

```bash
npm install @replit/object-storage
```

## Architecture

```
┌─────────────────┐
│   Client Form   │ (Email attachments, artwork uploads)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Multer        │ (Temporary local storage)
│   Middleware    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Replit Storage │ (Permanent cloud storage)
│     Service     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database       │ (Store file metadata & URLs)
│  References     │
└─────────────────┘
```

## Implementation Steps

### 1. Create Storage Service

**File:** `server/replitStorage.ts`

```typescript
import { Client } from '@replit/object-storage';
import fs from 'fs';
import path from 'path';

export class ReplitStorageService {
  private client: Client;
  private initialized: boolean = false;
  
  constructor() {
    this.client = new Client();
  }

  /**
   * Initialize storage client with bucket ID
   * Auto-called on first use, but can be called manually
   */
  async initialize() {
    if (this.initialized) return;
    
    // If REPLIT_BUCKET_ID is set, use it explicitly
    if (process.env.REPLIT_BUCKET_ID) {
      await this.client.init(process.env.REPLIT_BUCKET_ID);
      console.log('✓ Replit Storage initialized with bucket:', process.env.REPLIT_BUCKET_ID);
    }
    // Otherwise SDK will auto-detect from Replit environment
    
    this.initialized = true;
  }

  /**
   * Upload file from local filesystem to Replit Storage
   * @param localPath - Path to local file (from multer)
   * @param storagePath - Destination path in storage (e.g., 'attachments/order-123/file.pdf')
   * @returns Storage URL or null if failed
   */
  async uploadFile(localPath: string, storagePath: string): Promise<string | null> {
    try {
      await this.initialize(); // Ensure initialized
      
      const { ok, error } = await this.client.uploadFromFilename(
        storagePath,
        localPath
      );
      
      if (!ok) {
        console.error('Failed to upload to Replit Storage:', error);
        return null;
      }
      
      // Delete local temp file after successful upload
      fs.unlinkSync(localPath);
      
      return storagePath;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  }

  /**
   * Upload from buffer (for direct uploads without multer)
   * @param buffer - File buffer
   * @param storagePath - Destination path
   * @returns Storage URL or null if failed
   */
  async uploadFromBuffer(buffer: Buffer, storagePath: string): Promise<string | null> {
    try {
      const { ok, error } = await this.client.uploadFromBytes(
        storagePath,
        buffer
      );
      
      if (!ok) {
        console.error('Failed to upload buffer:', error);
        return null;
      }
      
      return storagePath;
    } catch (error) {
      console.error('Error uploading buffer:', error);
      return null;
    }
  }

  /**
   * Download file as buffer
   * @param storagePath - Path in storage
   * @returns File buffer or null if failed
   */
  async downloadFile(storagePath: string): Promise<Buffer | null> {
    try {
      const { ok, value, error } = await this.client.downloadAsBytes(storagePath);
      
      if (!ok) {
        console.error('Failed to download from storage:', error);
        return null;
      }
      
      return value;
    } catch (error) {
      console.error('Error downloading file:', error);
      return null;
    }
  }

  /**
   * Delete file from storage
   * @param storagePath - Path in storage
   * @returns Success status
   */
  async deleteFile(storagePath: string): Promise<boolean> {
    try {
      const { ok, error } = await this.client.delete(storagePath);
      
      if (!ok) {
        console.error('Failed to delete from storage:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Check if file exists
   * @param storagePath - Path in storage
   * @returns True if exists
   */
  async fileExists(storagePath: string): Promise<boolean> {
    try {
      const { ok, value } = await this.client.exists(storagePath);
      return ok ? value : false;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * List files in a directory
   * @param prefix - Directory prefix (e.g., 'attachments/order-123/')
   * @returns List of file paths
   */
  async listFiles(prefix?: string): Promise<string[]> {
    try {
      const { ok, value, error } = await this.client.list({
        prefix,
      });
      
      if (!ok) {
        console.error('Failed to list files:', error);
        return [];
      }
      
      return value.map(obj => obj.key);
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  /**
   * Generate storage path for file
   * @param category - Category (e.g., 'attachments', 'artwork', 'invoices')
   * @param identifier - Unique identifier (e.g., order ID, company ID)
   * @param filename - Original filename
   * @returns Generated storage path
   */
  generateStoragePath(category: string, identifier: string, filename: string): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${category}/${identifier}/${timestamp}-${sanitizedFilename}`;
  }
}

export const replitStorage = new ReplitStorageService();
```

### 2. Database Schema for Attachments

**File:** `migrations/0008_add_attachments.sql`

```sql
-- Attachments table for storing file metadata
CREATE TABLE IF NOT EXISTS "attachments" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" varchar REFERENCES "orders"("id") ON DELETE CASCADE,
  "communication_id" varchar REFERENCES "communications"("id") ON DELETE CASCADE,
  "filename" varchar NOT NULL,
  "original_filename" varchar NOT NULL,
  "storage_path" varchar NOT NULL,
  "mime_type" varchar,
  "file_size" integer,
  "category" varchar DEFAULT 'attachment', -- 'attachment', 'artwork', 'invoice', 'proof'
  "uploaded_by" varchar REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS "idx_attachments_order_id" ON "attachments"("order_id");
CREATE INDEX IF NOT EXISTS "idx_attachments_communication_id" ON "attachments"("communication_id");
CREATE INDEX IF NOT EXISTS "idx_attachments_category" ON "attachments"("category");
```

**Add to schema:** `shared/project-schema.ts`

```typescript
export const attachments = pgTable("attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }),
  communicationId: varchar("communication_id").references(() => communications.id, { onDelete: "cascade" }),
  filename: varchar("filename").notNull(),
  originalFilename: varchar("original_filename").notNull(),
  storagePath: varchar("storage_path").notNull(),
  mimeType: varchar("mime_type"),
  fileSize: integer("file_size"),
  category: varchar("category").default("attachment"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;
```

### 3. API Endpoints

**File:** `server/routes.ts`

```typescript
import { replitStorage } from './replitStorage';

// Upload attachment endpoint
app.post("/api/orders/:orderId/attachments", 
  isAuthenticated, 
  upload.array('files', 10), 
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const files = req.files as Express.Multer.File[];
      const { category = 'attachment' } = req.body;
      const userId = req.user?.claims?.sub;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const uploadedAttachments = [];

      for (const file of files) {
        // Generate storage path
        const storagePath = replitStorage.generateStoragePath(
          category,
          orderId,
          file.originalname
        );

        // Upload to Replit Storage
        const uploadedPath = await replitStorage.uploadFile(
          file.path,
          storagePath
        );

        if (!uploadedPath) {
          console.error(`Failed to upload ${file.originalname}`);
          continue;
        }

        // Save metadata to database
        const [attachment] = await db
          .insert(attachments)
          .values({
            orderId,
            filename: file.filename,
            originalFilename: file.originalname,
            storagePath: uploadedPath,
            mimeType: file.mimetype,
            fileSize: file.size,
            category,
            uploadedBy: userId,
          })
          .returning();

        uploadedAttachments.push(attachment);
      }

      res.json({
        success: true,
        attachments: uploadedAttachments,
      });
    } catch (error) {
      console.error('Error uploading attachments:', error);
      res.status(500).json({ message: 'Failed to upload attachments' });
    }
  }
);

// Download attachment endpoint
app.get("/api/attachments/:attachmentId/download", 
  isAuthenticated, 
  async (req, res) => {
    try {
      const { attachmentId } = req.params;
      
      // Get attachment metadata
      const [attachment] = await db
        .select()
        .from(attachments)
        .where(eq(attachments.id, attachmentId));

      if (!attachment) {
        return res.status(404).json({ message: 'Attachment not found' });
      }

      // Download from storage
      const fileBuffer = await replitStorage.downloadFile(attachment.storagePath);

      if (!fileBuffer) {
        return res.status(500).json({ message: 'Failed to download file' });
      }

      // Set headers for download
      res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalFilename}"`);
      res.setHeader('Content-Length', fileBuffer.length);

      res.send(fileBuffer);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      res.status(500).json({ message: 'Failed to download attachment' });
    }
  }
);

// Delete attachment endpoint
app.delete("/api/attachments/:attachmentId", 
  isAuthenticated, 
  async (req, res) => {
    try {
      const { attachmentId } = req.params;
      
      // Get attachment metadata
      const [attachment] = await db
        .select()
        .from(attachments)
        .where(eq(attachments.id, attachmentId));

      if (!attachment) {
        return res.status(404).json({ message: 'Attachment not found' });
      }

      // Delete from storage
      await replitStorage.deleteFile(attachment.storagePath);

      // Delete from database
      await db.delete(attachments).where(eq(attachments.id, attachmentId));

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting attachment:', error);
      res.status(500).json({ message: 'Failed to delete attachment' });
    }
  }
);

// List order attachments
app.get("/api/orders/:orderId/attachments", 
  isAuthenticated, 
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { category } = req.query;
      
      let query = db
        .select()
        .from(attachments)
        .where(eq(attachments.orderId, orderId));

      if (category) {
        query = query.where(eq(attachments.category, category as string));
      }

      const orderAttachments = await query;

      res.json(orderAttachments);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      res.status(500).json({ message: 'Failed to fetch attachments' });
    }
  }
);
```

### 4. Update Email Service to Handle Attachments

**File:** `server/emailService.ts`

```typescript
import { replitStorage } from './replitStorage';

async sendClientEmail(data: {
  from?: string;
  fromName?: string;
  to: string;
  subject: string;
  body: string;
  orderNumber?: string;
  companyName?: string;
  attachments?: Array<{ storagePath: string; originalFilename: string; mimeType?: string }>;
}) {
  // ... existing HTML template ...

  const mailOptions: any = {
    from: `"${fromName}" <${fromEmail}>`,
    to: data.to,
    subject: data.subject,
    html,
    text: data.body,
  };

  // Add attachments if provided
  if (data.attachments && data.attachments.length > 0) {
    mailOptions.attachments = await Promise.all(
      data.attachments.map(async (att) => {
        const buffer = await replitStorage.downloadFile(att.storagePath);
        return {
          filename: att.originalFilename,
          content: buffer,
          contentType: att.mimeType,
        };
      })
    );
  }

  const info = await this.transporter.sendMail(mailOptions);
  return { id: info.messageId, ...info };
}
```

### 5. Frontend Integration

**Update:** `client/src/components/OrderDetailsModal.tsx`

```typescript
// Upload attachments before sending email
const uploadAttachments = async (files: File[], orderId: string) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  formData.append('category', 'email_attachment');

  const response = await fetch(`/api/orders/${orderId}/attachments`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  return data.attachments;
};

const handleSendEmail = async () => {
  // ... validation ...

  // Upload attachments first
  let attachmentIds: string[] = [];
  if (emailAttachments.length > 0) {
    const uploaded = await uploadAttachments(emailAttachments, currentOrder.id);
    attachmentIds = uploaded.map((att: any) => att.id);
  }

  // Send email with attachment references
  sendClientEmailMutation.mutate({
    fromEmail: emailFrom,
    fromName: emailFromName || "SwagSuite",
    recipientEmail: emailTo,
    subject: emailSubject,
    body: emailBody,
    attachmentIds,
  });

  // Clear state...
};
```

## Usage Examples

### Upload Single File
```typescript
const storagePath = replitStorage.generateStoragePath(
  'attachments',
  'order-123',
  'invoice.pdf'
);

const uploaded = await replitStorage.uploadFile(
  '/tmp/uploaded-file.pdf',
  storagePath
);
```

### Upload Multiple Files
```typescript
for (const file of files) {
  const storagePath = replitStorage.generateStoragePath(
    'artwork',
    companyId,
    file.originalname
  );
  await replitStorage.uploadFile(file.path, storagePath);
}
```

### Download File
```typescript
const buffer = await replitStorage.downloadFile('attachments/order-123/invoice.pdf');
res.setHeader('Content-Type', 'application/pdf');
res.send(buffer);
```

### List Files
```typescript
const files = await replitStorage.listFiles('attachments/order-123/');
console.log('Order attachments:', files);
```

### Delete File
```typescript
await replitStorage.deleteFile('attachments/order-123/old-file.pdf');
```

## File Organization Structure

```
Replit Storage Root
├── attachments/
│   ├── order-{orderId}/
│   │   ├── {timestamp}-file1.pdf
│   │   └── {timestamp}-file2.png
│   └── ...
├── artwork/
│   ├── company-{companyId}/
│   │   ├── {timestamp}-logo.ai
│   │   └── {timestamp}-design.eps
│   └── ...
├── invoices/
│   ├── order-{orderId}/
│   │   └── {timestamp}-invoice.pdf
│   └── ...
├── proofs/
│   ├── order-{orderId}/
│   │   └── {timestamp}-proof.jpg
│   └── ...
└── documents/
    └── ...
```

## Security Considerations

1. **Authentication Required**: All endpoints must use `isAuthenticated` middleware
2. **File Type Validation**: Validate MIME types in multer configuration
3. **File Size Limits**: Set appropriate limits (already configured in multer)
4. **Access Control**: Verify user has permission to access order/files
5. **Path Sanitization**: Use `generateStoragePath` to prevent path traversal

## Environment Variables

### Required (if not auto-detected):

```bash
# Optional: Explicit bucket ID if using multiple buckets
# or if auto-detection doesn't work
REPLIT_BUCKET_ID=your-bucket-id
```

### How to Get Bucket ID:

1. **Via Replit Dashboard**:
   - Go to Replit workspace
   - Navigate to Storage tab
   - Copy Bucket ID

2. **Via Code** (get current bucket):
```typescript
const client = new Client();
const bucket = await client.getBucket();
console.log('Current Bucket ID:', bucket.id);
```

### Auto-Configuration:

- ✅ When running on Replit, SDK **auto-detects** bucket from environment
- ✅ No explicit bucket ID needed in most cases
- ✅ Only set `REPLIT_BUCKET_ID` if:
  - Using multiple buckets
  - Need to switch between buckets
  - Auto-detection not working

For local development, authenticate with Replit CLI:
```bash
replit login
```

## Migration Path

1. Install package: `npm install @replit/object-storage`
2. Create `replitStorage.ts` service
3. Run database migration: `npm run db:push` (for attachments table)
4. Update routes with new endpoints
5. Update emailService to handle attachments
6. Update frontend to upload files before sending emails
7. Test with sample uploads

## Benefits

- ✅ **Scalable**: No local disk space issues
- ✅ **Persistent**: Files survive Repl restarts
- ✅ **Fast**: CDN-backed storage
- ✅ **Organized**: Structured file paths by category
- ✅ **Integrated**: Native Replit integration
- ✅ **Secure**: Access controlled via auth middleware

## Next Steps

1. Implement storage service
2. Add database schema for attachments
3. Create API endpoints
4. Update email service
5. Update frontend components
6. Test upload/download flow
7. Add file preview functionality
