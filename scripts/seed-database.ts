import { pool, db } from "../server/db";
import { users, products, UserRole } from "../shared/schema";
import { hashPassword } from "../server/auth";
import { nanoid } from "nanoid";

// Function to generate a unique referral code
function generateReferralCode() {
  return nanoid(8).toUpperCase();
}

async function seedDatabase() {
  console.log("Starting database seeding...");

  try {
    // Check if database has been already seeded
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log("Database already contains data, skipping seed operation");
      return;
    }

    // Create admin user
    const adminReferralCode = generateReferralCode();
    const hashedAdminPassword = await hashPassword("admin123");

    const [adminUser] = await db.insert(users).values({
      username: "admin",
      password: hashedAdminPassword,
      email: "admin@referearn.com",
      fullName: "Admin User",
      role: UserRole.ADMIN,
      referralCode: adminReferralCode,
    }).returning();

    console.log(`Created admin user with ID: ${adminUser.id}`);

    // Create sample users
    const demoReferralCode = generateReferralCode();
    const hashedUserPassword = await hashPassword("password123");

    const [demoUser] = await db.insert(users).values({
      username: "demo",
      password: hashedUserPassword,
      email: "demo@example.com",
      fullName: "Demo User",
      role: UserRole.USER,
      referralCode: demoReferralCode,
    }).returning();

    console.log(`Created demo user with ID: ${demoUser.id}`);

    // Create sample affiliator
    const affiliatorReferralCode = generateReferralCode();

    const [affiliator] = await db.insert(users).values({
      username: "affiliator",
      password: hashedUserPassword,
      email: "affiliator@example.com",
      fullName: "Affiliate Manager",
      role: UserRole.AFFILIATOR,
      referralCode: affiliatorReferralCode,
      referredBy: adminUser.id,
    }).returning();

    console.log(`Created affiliator user with ID: ${affiliator.id}`);

    // Create sample active user
    const activeUserReferralCode = generateReferralCode();

    const [activeUser] = await db.insert(users).values({
      username: "activeuser",
      password: hashedUserPassword,
      email: "active@example.com",
      fullName: "Active User",
      role: UserRole.ACTIVE_USER,
      referralCode: activeUserReferralCode,
      referredBy: affiliator.id,
    }).returning();

    console.log(`Created active user with ID: ${activeUser.id}`);

    // Create referred user
    const referredUserReferralCode = generateReferralCode();

    const [referredUser] = await db.insert(users).values({
      username: "referred",
      password: hashedUserPassword,
      email: "referred@example.com",
      fullName: "Referred User",
      role: UserRole.USER,
      referralCode: referredUserReferralCode,
      referredBy: activeUser.id,
    }).returning();

    console.log(`Created referred user with ID: ${referredUser.id}`);

    // Add sample products
    const sampleProducts = [
      {
        name: "Wireless Headphones",
        description: "Premium wireless headphones with noise cancellation and 20-hour battery life.",
        price: 129.99,
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
        commission: 10,
        rating: 4.5,
        reviewCount: 75,
      },
      {
        name: "Sport Sneakers",
        description: "Comfortable athletic shoes with responsive cushioning and breathable mesh upper.",
        price: 89.99,
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
        commission: 15,
        rating: 4.3,
        reviewCount: 120,
      },
      {
        name: "Smart Watch",
        description: "Feature-rich smartwatch with heart rate monitoring, GPS, and 5-day battery life.",
        price: 199.99,
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
        commission: 12,
        rating: 4.7,
        reviewCount: 48,
      },
      {
        name: "Portable Speaker",
        description: "Waterproof Bluetooth speaker with deep bass and 12-hour playtime.",
        price: 59.99,
        imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f",
        commission: 8,
        rating: 4.2,
        reviewCount: 93,
      },
    ];

    const insertedProducts = await db.insert(products).values(sampleProducts).returning();
    console.log(`Added ${insertedProducts.length} sample products`);

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    // Close the database connection pool
    await pool.end();
  }
}

// Run the seeding function
seedDatabase().catch(console.error);