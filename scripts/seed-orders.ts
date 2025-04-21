import { pool, db } from "../server/db";
import { orders } from "../shared/schema";

async function seedOrders() {
  console.log("Starting orders seeding...");

  try {
    // First check if we already have orders
    const existingOrders = await db.select().from(orders);
    if (existingOrders.length > 0) {
      console.log("Database already contains orders, skipping seed operation");
      return;
    }

    // Sample orders for different users
    const sampleOrders = [
      // Orders for Active User (id: 4)
      {
        userId: 4,
        productId: 3, // Smart Watch
        amount: 199.99,
        status: "COMPLETED"
      },
      // Orders for Referred User (id: 5)
      {
        userId: 5,
        productId: 1, // Wireless Headphones
        amount: 129.99,
        status: "COMPLETED"
      },
      // Orders for Demo User (id: 2)
      {
        userId: 2,
        productId: 2, // Sport Sneakers
        amount: 89.99,
        status: "COMPLETED"
      },
      {
        userId: 2,
        productId: 4, // Portable Speaker
        amount: 59.99,
        status: "PENDING"
      }
    ];

    // Insert orders into the database
    const insertedOrders = await db.insert(orders).values(sampleOrders).returning();
    console.log(`Added ${insertedOrders.length} sample orders`);

    console.log("Orders seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding orders:", error);
  } finally {
    // Close the database connection pool
    await pool.end();
  }
}

// Run the seeding function
seedOrders().catch(console.error);