import { 
  users, User, InsertUser, 
  products, Product, InsertProduct,
  orders, Order, InsertOrder,
  transactions, Transaction, InsertTransaction,
  UserRole
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  createUser(user: Partial<InsertUser> & { referralCode: string; referredBy?: number | null }): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getAllProducts(): Promise<Product[]>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  getUserOrders(userId: number): Promise<Order[]>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  
  // Referral operations
  getReferrals(userId: number): Promise<User[]>;
  
  // Role activation
  activateUserRole(userId: number, role: UserRole, referralCode?: string): Promise<User>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private transactions: Map<number, Transaction>;
  sessionStore: session.Store;
  
  private userIdCounter: number;
  private productIdCounter: number;
  private orderIdCounter: number;
  private transactionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.transactions = new Map();
    
    this.userIdCounter = 1;
    this.productIdCounter = 1;
    this.orderIdCounter = 1;
    this.transactionIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123", // This would be hashed in real implementation
      email: "admin@referearn.com",
      fullName: "Admin User",
      role: UserRole.ADMIN,
      referralCode: "ADMIN123"
    });
    
    // Add sample products
    this.createProduct({
      name: "Wireless Headphones",
      description: "Premium wireless headphones with noise cancellation and 20-hour battery life.",
      price: 129.99,
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
      commission: 10
    });
    
    this.createProduct({
      name: "Sport Sneakers",
      description: "Comfortable athletic shoes with responsive cushioning and breathable mesh upper.",
      price: 89.99,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
      commission: 15
    });
    
    this.createProduct({
      name: "Smart Watch",
      description: "Feature-rich smartwatch with heart rate monitoring, GPS, and 5-day battery life.",
      price: 199.99,
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
      commission: 12
    });
    
    this.createProduct({
      name: "Portable Speaker",
      description: "Waterproof Bluetooth speaker with deep bass and 12-hour playtime.",
      price: 59.99,
      imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f",
      commission: 8
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }
  
  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.referralCode === referralCode,
    );
  }

  async createUser(userData: Partial<InsertUser> & { referralCode: string; referredBy?: number | null }): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    
    const user: User = {
      id,
      username: userData.username!,
      password: userData.password!,
      email: userData.email!,
      fullName: userData.fullName!,
      role: userData.role || UserRole.USER,
      referralCode: userData.referralCode,
      referredBy: userData.referredBy || null,
      createdAt
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async createProduct(productData: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const createdAt = new Date();
    
    const product: Product = {
      id,
      name: productData.name,
      description: productData.description,
      price: productData.price,
      imageUrl: productData.imageUrl,
      commission: productData.commission,
      rating: 4.5, // Default value
      reviewCount: Math.floor(Math.random() * 100) + 10, // Random review count
      createdAt
    };
    
    this.products.set(id, product);
    return product;
  }
  
  async updateProduct(id: number, data: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...data };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }
  
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async createOrder(orderData: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const createdAt = new Date();
    
    const order: Order = {
      id,
      userId: orderData.userId,
      productId: orderData.productId,
      referralCode: orderData.referralCode || null,
      amount: orderData.amount,
      status: "COMPLETED",
      createdAt
    };
    
    this.orders.set(id, order);
    
    // Process commissions if referral code is provided
    if (order.referralCode) {
      this.processOrderCommissions(order);
    }
    
    return order;
  }
  
  async getUserOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId
    );
  }
  
  // Transaction methods
  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const createdAt = new Date();
    
    const transaction: Transaction = {
      id,
      userId: transactionData.userId,
      type: transactionData.type,
      amount: transactionData.amount,
      description: transactionData.description,
      relatedUserId: transactionData.relatedUserId || null,
      relatedOrderId: transactionData.relatedOrderId || null,
      createdAt
    };
    
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.userId === userId
    );
  }
  
  // Referral methods
  async getReferrals(userId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.referredBy === userId
    );
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
    
    // Create activation fee transaction
    await this.createTransaction({
      userId,
      type: "ACTIVATION_FEE",
      amount: -amount,
      description: `Activation fee for ${role} role`,
    });
    
    // Process referral commissions if referral code is provided
    if (referralCode && user.referredBy) {
      await this.processRoleActivationCommissions(user, amount, role);
    }
    
    return updatedUser!;
  }
  
  // Helper methods
  private async processRoleActivationCommissions(user: User, amount: number, role: UserRole): Promise<void> {
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
      await this.createTransaction({
        userId: referrerId,
        type: "REFERRAL_COMMISSION",
        amount: commissionAmount,
        description: `Level ${i+1} commission for ${role} activation by ${user.username}`,
        relatedUserId: user.id
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

export const storage = new MemStorage();
