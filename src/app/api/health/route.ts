import { NextResponse } from "next/server";
import { prisma, testDatabaseConnection } from "@/lib/prisma";

export async function GET() {
  const healthInfo = {
    status: "unknown",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    database: {
      status: "unknown",
      url_configured: !!process.env.DATABASE_URL,
      direct_url_configured: !!process.env.DIRECT_URL,
    },
    system: {
      nodejs_version: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
    }
  };

  try {
    // Skip database check during build time or if URL is placeholder
    const isPlaceholderUrl = process.env.DATABASE_URL?.includes("username:password") || 
                            process.env.DATABASE_URL?.includes("ep-xxx-xxx");
    
    if (process.env.NODE_ENV === "production" && isPlaceholderUrl) {
      healthInfo.status = "degraded";
      healthInfo.database.status = "not-configured";
      return NextResponse.json(healthInfo, { status: 503 });
    }

    // Test database connection
    const dbConnected = await testDatabaseConnection();
    
    if (dbConnected) {
      // Additional database health checks
      try {
        const userCount = await prisma.user.count();
        const reportCount = await prisma.report.count();
        const categoryCount = await prisma.category.count();
        
        healthInfo.status = "healthy";
        (healthInfo.database as any) = {
          status: "connected",
          url_configured: !!process.env.DATABASE_URL,
          direct_url_configured: !!process.env.DIRECT_URL,
          statistics: {
            users: userCount,
            reports: reportCount,
            categories: categoryCount,
          }
        };
        
        return NextResponse.json(healthInfo, { status: 200 });
      } catch (queryError) {
        console.error("Database query failed:", queryError);
        healthInfo.status = "degraded";
        healthInfo.database.status = "connected-but-query-failed";
        return NextResponse.json(healthInfo, { status: 503 });
      }
    } else {
      healthInfo.status = "unhealthy";
      healthInfo.database.status = "connection-failed";
      return NextResponse.json(healthInfo, { status: 503 });
    }
  } catch (error) {
    console.error("Health check failed:", error);
    
    healthInfo.status = "unhealthy";
    healthInfo.database.status = "error";
    
    return NextResponse.json(
      {
        ...healthInfo,
        error: "Service unavailable",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
