import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertCompanySchema, 
  insertContactSchema, 
  insertSupplierSchema,
  insertProductSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertArtworkFileSchema,
  insertActivitySchema
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common artwork file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'application/postscript', // .ai, .eps files
      'image/svg+xml'
    ];
    
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.toLowerCase().endsWith('.ai') ||
        file.originalname.toLowerCase().endsWith('.eps')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDF, AI, and EPS files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/recent-orders', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const orders = await storage.getRecentOrders(limit);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      res.status(500).json({ message: "Failed to fetch recent orders" });
    }
  });

  app.get('/api/dashboard/team-leaderboard', isAuthenticated, async (req, res) => {
    try {
      const leaderboard = await storage.getTeamLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching team leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch team leaderboard" });
    }
  });

  // Company/Customer routes
  app.get('/api/companies', isAuthenticated, async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get('/api/companies/search', isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const companies = await storage.searchCompanies(query);
      res.json(companies);
    } catch (error) {
      console.error("Error searching companies:", error);
      res.status(500).json({ message: "Failed to search companies" });
    }
  });

  app.get('/api/companies/:id', isAuthenticated, async (req, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.post('/api/companies', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validatedData);
      
      // Log activity
      await storage.createActivity({
        userId: (req.user as any)?.claims?.sub,
        entityType: 'company',
        entityId: company.id,
        action: 'created',
        description: `Created company: ${company.name}`,
      });
      
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.patch('/api/companies/:id', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(req.params.id, validatedData);
      
      // Log activity
      await storage.createActivity({
        userId: (req.user as any)?.claims?.sub,
        entityType: 'company',
        entityId: company.id,
        action: 'updated',
        description: `Updated company: ${company.name}`,
      });
      
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.delete('/api/companies/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteCompany(req.params.id);
      
      // Log activity
      await storage.createActivity({
        userId: (req.user as any)?.claims?.sub,
        entityType: 'company',
        entityId: req.params.id,
        action: 'deleted',
        description: `Deleted company`,
      });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // Contact routes
  app.get('/api/contacts', isAuthenticated, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      const contacts = await storage.getContacts(companyId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post('/api/contacts', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  // Supplier routes
  app.get('/api/suppliers', isAuthenticated, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post('/api/suppliers', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  // Product routes
  app.get('/api/products', isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/search', isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const products = await storage.searchProducts(query);
      res.json(products);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Order routes
  app.get('/api/orders', isAuthenticated, async (req, res) => {
    try {
      const status = req.query.status as string;
      const companyId = req.query.companyId as string;
      
      let orders;
      if (status) {
        orders = await storage.getOrdersByStatus(status);
      } else if (companyId) {
        orders = await storage.getOrdersByCompany(companyId);
      } else {
        orders = await storage.getOrders();
      }
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', isAuthenticated, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse({
        ...req.body,
        assignedUserId: (req.user as any)?.claims?.sub,
      });
      
      const order = await storage.createOrder(validatedData);
      
      // Log activity
      await storage.createActivity({
        userId: (req.user as any)?.claims?.sub,
        entityType: 'order',
        entityId: order.id,
        action: 'created',
        description: `Created order: ${order.orderNumber}`,
      });
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.patch('/api/orders/:id', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(req.params.id, validatedData);
      
      // Log activity
      await storage.createActivity({
        userId: (req.user as any)?.claims?.sub,
        entityType: 'order',
        entityId: order.id,
        action: 'updated',
        description: `Updated order: ${order.orderNumber}`,
      });
      
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Order items routes
  app.get('/api/orders/:orderId/items', isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getOrderItems(req.params.orderId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching order items:", error);
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  });

  app.post('/api/orders/:orderId/items', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertOrderItemSchema.parse({
        ...req.body,
        orderId: req.params.orderId,
      });
      const item = await storage.createOrderItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating order item:", error);
      res.status(500).json({ message: "Failed to create order item" });
    }
  });

  // Artwork upload routes
  app.post('/api/artwork/upload', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { orderId, companyId } = req.body;
      
      const artworkFile = await storage.createArtworkFile({
        orderId: orderId || null,
        companyId: companyId || null,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        filePath: req.file.path,
        uploadedBy: req.user?.claims?.sub,
      });

      res.status(201).json(artworkFile);
    } catch (error) {
      console.error("Error uploading artwork:", error);
      res.status(500).json({ message: "Failed to upload artwork" });
    }
  });

  app.get('/api/artwork', isAuthenticated, async (req, res) => {
    try {
      const orderId = req.query.orderId as string;
      const companyId = req.query.companyId as string;
      const files = await storage.getArtworkFiles(orderId, companyId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching artwork files:", error);
      res.status(500).json({ message: "Failed to fetch artwork files" });
    }
  });

  // Activity/Timeline routes
  app.get('/api/activities', isAuthenticated, async (req, res) => {
    try {
      const entityType = req.query.entityType as string;
      const entityId = req.query.entityId as string;
      const activities = await storage.getActivities(entityType, entityId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // AI Search route (placeholder)
  app.post('/api/search/ai', isAuthenticated, async (req, res) => {
    try {
      const { query } = req.body;
      
      // This would integrate with an AI service to process natural language queries
      // For now, return a placeholder response
      res.json({
        query,
        results: [],
        message: "AI search functionality would be implemented here with integration to OpenAI or similar service",
      });
    } catch (error) {
      console.error("Error processing AI search:", error);
      res.status(500).json({ message: "Failed to process AI search" });
    }
  });

  // Universal search route
  app.get('/api/search', isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      // Search across multiple entities
      const [companies, products] = await Promise.all([
        storage.searchCompanies(query),
        storage.searchProducts(query),
      ]);

      res.json({
        companies: companies.slice(0, 5),
        products: products.slice(0, 5),
        orders: [],
      });
    } catch (error) {
      console.error("Error performing universal search:", error);
      res.status(500).json({ message: "Failed to perform search" });
    }
  });

  // Enhanced Integration Routes
  
  // HubSpot Integration Routes
  app.get('/api/integrations/hubspot/status', isAuthenticated, async (req, res) => {
    try {
      // Mock HubSpot sync status - would integrate with actual HubSpot API
      res.json({
        lastSync: new Date().toISOString(),
        status: 'active',
        recordsProcessed: 150,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch HubSpot status" });
    }
  });

  app.get('/api/integrations/hubspot/metrics', isAuthenticated, async (req, res) => {
    try {
      // Mock HubSpot metrics - would integrate with actual HubSpot API
      res.json({
        totalContacts: 2847,
        pipelineDeals: 89,
        monthlyRevenue: 285000,
        conversionRate: 24.5,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch HubSpot metrics" });
    }
  });

  app.post('/api/integrations/hubspot/sync', isAuthenticated, async (req, res) => {
    try {
      const { syncType } = req.body;
      // Mock sync initiation - would trigger actual HubSpot sync
      res.json({ message: `${syncType} sync initiated successfully` });
    } catch (error) {
      res.status(500).json({ message: "Failed to start HubSpot sync" });
    }
  });

  // Slack Integration Routes
  app.get('/api/integrations/slack/channels', isAuthenticated, async (req, res) => {
    try {
      // Mock Slack channels - would integrate with actual Slack API
      res.json([
        { id: 'general', name: 'general', memberCount: 25, isArchived: false },
        { id: 'sales', name: 'sales', memberCount: 12, isArchived: false },
        { id: 'production', name: 'production', memberCount: 8, isArchived: false },
        { id: 'alerts', name: 'alerts', memberCount: 15, isArchived: false },
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Slack channels" });
    }
  });

  app.get('/api/integrations/slack/messages', isAuthenticated, async (req, res) => {
    try {
      // Mock recent Slack messages - would integrate with actual Slack API
      res.json([
        {
          id: '1',
          content: 'New order from ABC Corp needs artwork approval',
          user: 'Sarah Johnson',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          channel: 'sales'
        },
        {
          id: '2', 
          content: 'Weekly production meeting at 2pm',
          user: 'Mike Davis',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          channel: 'production'
        }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Slack messages" });
    }
  });

  app.post('/api/integrations/slack/send', isAuthenticated, async (req, res) => {
    try {
      const { channel, message } = req.body;
      // Mock message sending - would integrate with actual Slack API
      res.json({ message: "Message sent successfully to Slack" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send Slack message" });
    }
  });

  // AI News Monitoring Routes
  app.get('/api/integrations/news/items', isAuthenticated, async (req, res) => {
    try {
      // Mock news items - would integrate with AI news monitoring service
      res.json([
        {
          id: '1',
          headline: 'ABC Corp announces major expansion into promotional products',
          summary: 'Leading tech company ABC Corp is expanding their corporate gifting program with a $2M budget.',
          sourceUrl: 'https://example.com/news/abc-corp-expansion',
          sentiment: 'positive',
          relevanceScore: 9,
          entityType: 'company',
          entityName: 'ABC Corp',
          publishedAt: new Date(Date.now() - 3600000).toISOString(),
          alertsSent: false,
        },
        {
          id: '2',
          headline: 'Supply chain disruptions affecting promotional product industry',
          summary: 'Global supply chain issues are impacting delivery times for promotional products.',
          sourceUrl: 'https://example.com/news/supply-chain',
          sentiment: 'negative',
          relevanceScore: 7,
          entityType: 'industry',
          publishedAt: new Date(Date.now() - 7200000).toISOString(),
          alertsSent: true,
        }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch news items" });
    }
  });

  // Enhanced Dashboard Routes
  app.get('/api/dashboard/enhanced-stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getBasicStats();
      // Enhanced metrics with period comparisons
      res.json({
        ...stats,
        ytdRevenue: 2850000,
        lastYearYtdRevenue: 2200000,
        mtdRevenue: 285000,
        lastMonthRevenue: 260000,
        wtdRevenue: 65000,
        todayRevenue: 12000,
        pipelineValue: 1200000,
        conversionRate: 24.5,
        avgOrderValue: 3200,
        orderQuantity: 890,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enhanced dashboard stats" });
    }
  });

  app.get('/api/dashboard/team-leaderboard', isAuthenticated, async (req, res) => {
    try {
      // Mock team leaderboard - would calculate from actual user data
      res.json([
        {
          userId: '1',
          name: 'Sarah Johnson',
          avatar: 'SJ',
          ytdRevenue: 850000,
          mtdRevenue: 85000,
          wtdRevenue: 20000,
          ordersCount: 89,
          conversionRate: 28.5,
          contactsReached: 245,
          meetingsHeld: 67,
          rank: 1,
        },
        {
          userId: '2',
          name: 'Mike Davis',
          avatar: 'MD',
          ytdRevenue: 720000,
          mtdRevenue: 72000,
          wtdRevenue: 18000,
          ordersCount: 76,
          conversionRate: 25.2,
          contactsReached: 198,
          meetingsHeld: 54,
          rank: 2,
        }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team leaderboard" });
    }
  });

  app.get('/api/dashboard/automation-tasks', isAuthenticated, async (req, res) => {
    try {
      // Mock automation tasks - would fetch from actual AI automation system
      res.json([
        {
          id: '1',
          type: 'vendor_followup',
          title: 'Follow up with XYZ Supplier on Order #12345',
          description: 'Order placed 2 days ago with no confirmation received. Auto-generated follow-up ready.',
          priority: 'high',
          scheduledFor: new Date(Date.now() + 3600000).toISOString(),
          status: 'pending',
          entityName: 'XYZ Supplier',
        },
        {
          id: '2',
          type: 'customer_outreach',
          title: 'Sample suggestion for ABC Corp',
          description: 'Customer has decreased orders by 40% - suggest sending product samples.',
          priority: 'medium',
          scheduledFor: new Date(Date.now() + 7200000).toISOString(),
          status: 'pending',
          entityName: 'ABC Corp',
        }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch automation tasks" });
    }
  });

  app.get('/api/dashboard/news-alerts', isAuthenticated, async (req, res) => {
    try {
      // Mock news alerts - would fetch from AI news monitoring
      res.json([
        {
          id: '1',
          headline: 'ABC Corp announces Q4 record profits',
          entityName: 'ABC Corp',
          entityType: 'customer',
          sentiment: 'positive',
          relevanceScore: 8,
          publishedAt: new Date(Date.now() - 1800000).toISOString(),
        }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch news alerts" });
    }
  });

  // AI Report Generation Routes
  app.get('/api/reports/suggestions', isAuthenticated, async (req, res) => {
    try {
      res.json([
        {
          title: 'Top Performing Sales Reps',
          description: 'Revenue and conversion metrics by salesperson',
          query: 'Show me the top 10 sales reps by revenue this quarter with their conversion rates',
          category: 'sales',
        },
        {
          title: 'Vendor Spend Analysis',
          description: 'Year-over-year vendor spending comparison',
          query: 'Compare our vendor spending this year vs last year, show top 20 vendors',
          category: 'vendors',
        },
        {
          title: 'Customer Retention Report',
          description: 'Analysis of customer repeat orders and churn',
          query: 'Which customers have stopped ordering in the last 90 days and their previous order history',
          category: 'customers',
        },
        {
          title: 'Product Margin Analysis',
          description: 'Profit margins by product category',
          query: 'Show me profit margins by product category for the last 6 months',
          category: 'finance',
        }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch report suggestions" });
    }
  });

  app.post('/api/reports/generate', isAuthenticated, async (req, res) => {
    try {
      const { query } = req.body;
      // Mock AI report generation - would integrate with actual AI service
      res.json({
        id: Date.now().toString(),
        name: `AI Generated Report - ${new Date().toLocaleDateString()}`,
        query,
        data: [],
        summary: `Report generated based on your query: "${query}". This would contain actual data analysis from your SwagSuite database.`,
        generatedAt: new Date().toISOString(),
        exportFormats: ['pdf', 'xlsx', 'csv'],
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate AI report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
