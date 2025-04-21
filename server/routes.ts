import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { storage } from "./storage";
import { UserRole, insertProductSchema, insertOrderSchema } from "@shared/schema";
import Stripe from "stripe";

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

  // User profile update endpoints
  app.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { fullName, email } = req.body;
      
      // Validate email is not taken by another user
      if (email && email !== req.user!.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ error: "Email already in use" });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, { fullName, email });
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Password update endpoint
  app.patch("/api/user/password", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;
      
      // Get current user to check password
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // We already imported the password functions at the top
      
      // Verify current password
      const isPasswordValid = await comparePasswords(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      
      // Update password
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUser(userId, { password: hashedPassword });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Notification preferences endpoint
  app.patch("/api/user/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      // In a real app, you would store these preferences in a separate table
      // For now, just return success
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Support endpoint
  app.post("/api/support", isAuthenticated, async (req, res) => {
    try {
      const { subject, message } = req.body;
      
      // Validate input
      if (!subject || !message) {
        return res.status(400).json({ error: "Subject and message are required" });
      }
      
      // In a real app, you would store this in a database and/or send an email
      console.log(`Support request from ${req.user!.username}: ${subject}`);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe payment integration
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });

  // Create a payment intent for product purchase
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { productId } = req.body;
      
      // Fetch product details from database
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(product.price * 100), // Convert to cents
        currency: "usd",
        metadata: {
          productId: productId.toString(),
          userId: req.user!.id.toString(),
          productName: product.name
        },
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        product
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a payment intent for role activation
  app.post("/api/create-role-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { role, referralCode } = req.body;
      
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
      
      // Get activation fee based on role
      const amount = role === UserRole.ACTIVE_USER ? 50 : 150;
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: "usd",
        metadata: {
          role,
          userId: req.user!.id.toString(),
          referralCode: referralCode || ''
        },
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount,
        role
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook to handle successful payments
  app.post("/api/stripe-webhook", async (req, res) => {
    const payload = req.body;
    
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        req.headers["stripe-signature"] as string,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
      
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as any;
        const metadata = paymentIntent.metadata;
        
        if (metadata.productId) {
          // Product purchase
          const userId = parseInt(metadata.userId);
          const productId = parseInt(metadata.productId);
          const product = await storage.getProduct(productId);
          
          if (product) {
            // Create order
            const order = await storage.createOrder({
              userId,
              productId,
              amount: product.price,
              status: "COMPLETED"
            });
            
            console.log(`Created order: ${order.id} for user ${userId}`);
          }
        } else if (metadata.role) {
          // Role activation
          const userId = parseInt(metadata.userId);
          const role = metadata.role;
          const referralCode = metadata.referralCode;
          
          // Activate user role
          const user = await storage.activateUserRole(userId, role, referralCode);
          
          console.log(`Activated role ${role} for user ${userId}`);
        }
      }
      
      res.sendStatus(200);
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
