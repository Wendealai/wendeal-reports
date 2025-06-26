import { NextResponse } from "next/server";
import { initializeDatabase, checkDatabaseInitialization } from "@/lib/database-init";

/**
 * 手动初始化数据库
 */
export async function POST(request: Request) {
  try {
    console.log("🔧 Manual database initialization requested");
    
    // 强制重新初始化数据库
    const result = await initializeDatabase();
    
    return NextResponse.json({
      message: "数据库初始化成功",
      result
    });
    
  } catch (error) {
    console.error("Manual database initialization failed:", error);
    
    return NextResponse.json(
      {
        error: "数据库初始化失败",
        message: error instanceof Error ? error.message : "未知错误",
        details: process.env.NODE_ENV === "development" ? error : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * 检查数据库初始化状态
 */
export async function GET(request: Request) {
  try {
    console.log("🔍 Checking database initialization status");
    
    const isInitialized = await checkDatabaseInitialization();
    
    return NextResponse.json({
      initialized: isInitialized,
      message: isInitialized ? "数据库已初始化" : "数据库需要初始化"
    });
    
  } catch (error) {
    console.error("Failed to check database initialization:", error);
    
    return NextResponse.json(
      {
        initialized: false,
        error: "检查数据库状态失败",
        message: error instanceof Error ? error.message : "未知错误"
      },
      { status: 500 }
    );
  }
}
