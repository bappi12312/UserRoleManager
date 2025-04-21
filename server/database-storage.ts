import { 
  users, User, InsertUser, 
  products, Product, InsertProduct,
  orders, Order, InsertOrder,
  transactions, Transaction, InsertTransaction,
  UserRole
} from "@shared/schema";
import { IStorage } from "./storage";
import { db, pool } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, referralCode));
    return user;
  }

  async createUser(userData: Partial<InsertUser> & { referralCode: string; referredBy?: number | null }): Promise<User> {
    const [user] = await db.insert(users).values({
      username: userData.username!,
      password: userData.password!,
      email: userData.email!,
      fullName: userData.fullName!,
      role: userData.role || UserRole.USER,
      referralCode: userData.referralCode,
      referredBy: userData.referredBy || null,
    }).returning();
    
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  
  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values({
      name: productData.name,
      description: productData.description,
      price: productData.price,
      imageUrl: productData.imageUrl,
      commission: productData.commission,
      rating: 4.5, // Default value
      reviewCount: Math.floor(Math.random() * 100) + 10, // Random review count
    }).returning();
    
    return product;
  }
  
  async updateProduct(id: number, data: Partial<Product>): Promise<Product | undefined> {
    const [updatedProduct] = await db.update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();
    
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.count > 0;
  }
  
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }
  
  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }
  
  async createOrder(orderData: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values({
      userId: orderData.userId,
      productId: orderData.productId,
      referralCode: orderData.referralCode || null,
      amount: orderData.amount,
      status: "COMPLETED",
    }).returning();
    
    // Process commissions if referral code is provided
    if (order.referralCode) {
      await this.processOrderCommissions(order);
    }
    
    return order;
  }
  
  async getUserOrders(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  }
  
  // Transaction methods
  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values({
      userId: transactionData.userId,
      type: transactionData.type,
      amount: transactionData.amount,
      description: transactionData.description,
      relatedUserId: transactionData.relatedUserId || null,
      relatedOrderId: transactionData.relatedOrderId || null,
    }).returning();
    
    return transaction;
  }
  
  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db.select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }
  
  // Referral methods
  async getReferrals(userId: number): Promise<User[]> {
    return await db.select()
      .from(users)
      .where(eq(users.referredBy, userId));
  }
  
  // Role activation
  async activateUserRole(userId: number, role: UserRole, referralCode?: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    let amount = 0;
    if (role === UserRole.ACTIVE_USER) {
      amount = 100;
    } else if (role === UserRole.AFFILIATOR) {
      amount = 250;
    }
    
    // Update user role
    const updatedUser = await this.updateUser(userId, { role });
    if (!updatedUser) {
      throw new Error("Failed to update user role");
    }
    
    // Create activation fee transaction
    await this.createTransaction({
      userId,
      type: "ACTIVATION_FEE",
      amount: -amount,
      description: `Activation fee for ${role} role`,
    });
    
    // Process referral commissions if user was referred
    if (user.referredBy) {
      await this.processRoleActivationCommissions(user, amount, role);
    }
    
    return updatedUser;
  }
  
  // Helper methods
  private async processRoleActivationCommissions(user: User, amount: number, role: UserRole): Promise<void> {
    // Dynamically import socket notification functions to avoid circular dependency
    const { notifyTransactionUpdate, notifyUser } = await import('./socket');
    
    // Get the referral chain (up to 3 levels)
    const referrerIds: number[] = [];
    let currentUserId = user.referredBy;
    
    while (referrerIds.length < 3 && currentUserId) {
      const referrer = await this.getUser(currentUserId);
      if (referrer && (referrer.role === UserRole.ACTIVE_USER || referrer.role === UserRole.AFFILIATOR)) {
        referrerIds.push(referrer.id);
        currentUserId = referrer.referredBy;
      } else {
        break;
      }
    }
    
    // Calculate and distribute commissions
    const commissionRates = [0.2, 0.1, 0.05]; // 20%, 10%, 5%
    
    for (let i = 0; i < referrerIds.length && i < commissionRates.length; i++) {
      const referrerId = referrerIds[i];
      const commissionRate = commissionRates[i];
      const commissionAmount = amount * commissionRate;
      
      // Create commission transaction
      const transaction = await this.createTransaction({
        userId: referrerId,
        type: "REFERRAL_COMMISSION",
        amount: commissionAmount,
        description: `Level ${i+1} commission for ${role} activation by ${user.username}`,
        relatedUserId: user.id
      });
      
      // Send real-time notifications
      notifyTransactionUpdate(referrerId, transaction, `You received a new commission!`);
      notifyUser(referrerId, {
        type: 'success',
        title: 'Commission Received',
        message: `You received $${commissionAmount.toFixed(2)} commission from ${user.username} upgrading to ${role}!`,
        timestamp: new Date()
      });
    }
  }
  
  private async processOrderCommissions(order: Order): Promise<void> {
    // Find the product to get commission rate
    const product = await this.getProduct(order.productId);
    if (!product) return;
    
    // Find the affiliator using the referral code
    const affiliator = await this.getUserByReferralCode(order.referralCode!);
    if (!affiliator || affiliator.role !== UserRole.AFFILIATOR) return;
    
    // Calculate commission amount
    const commissionAmount = (product.commission / 100) * order.amount;
    
    // Create commission transaction
    await this.createTransaction({
      userId: affiliator.id,
      type: "PRODUCT_COMMISSION",
      amount: commissionAmount,
      description: `Commission for product ${product.name}`,
      relatedOrderId: order.id
    });
  }
}