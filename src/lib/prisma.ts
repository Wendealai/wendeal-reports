import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enhanced Prisma client with better error handling and connection management
function createPrismaClient() {
  try {
    console.log("🔧 Creating Prisma client...");
    console.log("Database URL configured:", !!process.env.DATABASE_URL);
    console.log("Environment:", process.env.NODE_ENV);
    
    const client = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      errorFormat: "pretty",
    });
    
    // Test connection on creation
    client.$connect()
      .then(() => {
        console.log("✅ Database connected successfully");
      })
      .catch((error) => {
        console.error("❌ Database connection failed:", error);
        // Don't throw here to avoid breaking the app startup
      });
    
    return client;
  } catch (error) {
    console.error("❌ Failed to create Prisma client:", error);
    throw error;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Helper function to test database connection
export async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connection test passed");
    return true;
  } catch (error) {
    console.error("❌ Database connection test failed:", error);
    return false;
  }
}

// Graceful shutdown handler
process.on("beforeExit", async () => {
  try {
    await prisma.$disconnect();
    console.log("✅ Database disconnected gracefully");
  } catch (error) {
    console.error("❌ Error during database disconnect:", error);
  }
});
