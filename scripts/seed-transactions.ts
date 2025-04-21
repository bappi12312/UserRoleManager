import { pool, db } from "../server/db";
import { transactions } from "../shared/schema";

async function seedTransactions() {
  console.log("Starting transaction seeding...");

  try {
    // First check if we already have transactions
    const existingTransactions = await db.select().from(transactions);
    if (existingTransactions.length > 0) {
      console.log("Database already contains transactions, skipping seed operation");
      return;
    }

    // Sample transactions for different users
    const sampleTransactions = [
      // Transactions for Affiliator (user id: 3)
      {
        userId: 3,
        type: "ROLE_ACTIVATION_COMMISSION",
        amount: 50,
        description: "Commission for Active User role activation",
        status: "COMPLETED",
        referredUserId: 4
      },
      {
        userId: 3,
        type: "PRODUCT_COMMISSION",
        amount: 24,
        description: "Commission for product purchase by Active User",
        status: "COMPLETED",
        referredUserId: 4
      },
      // Transactions for Active User (user id: 4)
      {
        userId: 4,
        type: "ROLE_ACTIVATION_COMMISSION",
        amount: 20,
        description: "Commission for Referred User role activation",
        status: "COMPLETED",
        referredUserId: 5
      },
      {
        userId: 4,
        type: "PRODUCT_PURCHASE",
        amount: -199.99,
        description: "Purchase of Smart Watch",
        status: "COMPLETED",
        orderId: 1
      },
      // Transactions for Admin (user id: 1)
      {
        userId: 1,
        type: "ROLE_ACTIVATION_COMMISSION",
        amount: 100,
        description: "Commission for Affiliator role activation",
        status: "COMPLETED",
        referredUserId: 3
      },
      {
        userId: 1,
        type: "ADMIN_COMMISSION",
        amount: 10,
        description: "Platform fee from product sale",
        status: "COMPLETED"
      },
      // Withdrawal transaction
      {
        userId: 3,
        type: "WITHDRAWAL",
        amount: -40,
        description: "Withdrawal to bank account",
        status: "COMPLETED"
      }
    ];

    // Insert transactions into the database
    const insertedTransactions = await db.insert(transactions).values(sampleTransactions).returning();
    console.log(`Added ${insertedTransactions.length} sample transactions`);

    console.log("Transaction seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding transactions:", error);
  } finally {
    // Close the database connection pool
    await pool.end();
  }
}

// Run the seeding function
seedTransactions().catch(console.error);