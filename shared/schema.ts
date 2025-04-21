import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User role types
export enum UserRole {
  USER = "USER",
  ACTIVE_USER = "ACTIVE_USER",
  AFFILIATOR = "AFFILIATOR",
  ADMIN = "ADMIN",
}

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default(UserRole.USER),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: integer("referred_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  imageUrl: text("image_url").notNull(),
  commission: doublePrecision("commission").notNull(),
  rating: doublePrecision("rating").default(0),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  referralCode: text("referral_code"),
  amount: doublePrecision("amount").notNull(),
  status: text("status").notNull().default("COMPLETED"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions table for payments and commissions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // ACTIVATION_FEE, REFERRAL_COMMISSION, PRODUCT_COMMISSION
  amount: doublePrecision("amount").notNull(),
  description: text("description").notNull(),
  relatedUserId: integer("related_user_id").references(() => users.id),
  relatedOrderId: integer("related_order_id").references(() => orders.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.nativeEnum(UserRole),
}).omit({ 
  id: true, 
  createdAt: true,
  referralCode: true
});

export const insertProductSchema = createInsertSchema(products, {
  price: z.number().positive(),
  commission: z.number().min(0).max(100),
}).omit({ 
  id: true, 
  createdAt: true,
  rating: true,
  reviewCount: true
});

export const insertOrderSchema = createInsertSchema(orders).omit({ 
  id: true, 
  createdAt: true,
  status: true
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({ 
  id: true, 
  createdAt: true
});

// Authentication schemas
export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// Role activation schemas
export const activateUserSchema = z.object({
  userId: z.number(),
  role: z.nativeEnum(UserRole),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type ActivateUserData = z.infer<typeof activateUserSchema>;
