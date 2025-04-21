import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { UserRole, insertProductSchema, insertOrderSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes and middlewares
  const { isAuthenticated, isAdmin } = setupAuth(app);

  // User routes
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Only allow users to see their own data unless admin
      if (req.user!.id !== userId && req.user!.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Role activation
  app.post("/api/users/activate", isAuthenticated, async (req, res) => {
    try {
      const { role, referralCode } = req.body;
      const userId = req.user!.id;
      
      // Validation
      if (![UserRole.ACTIVE_USER, UserRole.AFFILIATOR].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      // Check if user already has the role or higher
      if (
        (role === UserRole.ACTIVE_USER && req.user!.role !== UserRole.USER) ||
        (role === UserRole.AFFILIATOR && req.user!.role === UserRole.AFFILIATOR)
      ) {
        return res.status(400).json({ error: "User already has this role or higher" });
      }
      
      // Activate the role
      const updatedUser = await storage.activateUserRole(userId, role, referralCode);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Referral routes
  app.get("/api/referrals", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const referrals = await storage.getReferrals(userId);
      res.json(referrals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/products", isAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/products/:id", isAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const productData = req.body;
      
      const product = await storage.updateProduct(productId, productData);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/products/:id", isAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const success = await storage.deleteProduct(productId);
      
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Order routes
  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      // Get the product to calculate total amount
      const product = await storage.getProduct(orderData.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Create the order
      const order = await storage.createOrder({
        ...orderData,
        amount: product.price
      });
      
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const orders = await storage.getUserOrders(userId);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Transaction routes
  app.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
