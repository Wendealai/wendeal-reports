import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader, JWTPayload } from "@/lib/auth";
import { createLogger } from "@/lib/logger";

const logger = createLogger("Middleware");

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export function withAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context?: any) => {
    try {
      // 从请求头中提取 token
      const authHeader = request.headers.get("authorization");
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        return NextResponse.json({ error: "未提供认证令牌" }, { status: 401 });
      }

      // 验证 token
      const payload = verifyToken(token);

      if (!payload) {
        return NextResponse.json({ error: "无效的认证令牌" }, { status: 401 });
      }

      // 将用户信息添加到请求对象
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = payload;

      return handler(authenticatedRequest, context);
    } catch (error) {
      logger.error("Auth middleware error:", {
        message: error instanceof Error ? error.message : "Unknown auth error",
        name: error instanceof Error ? error.name : "AuthError",
      });
      return NextResponse.json({ error: "认证失败" }, { status: 401 });
    }
  };
}

// 可选认证中间件（用户可能已登录也可能未登录）
export function withOptionalAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context?: any) => {
    try {
      const authHeader = request.headers.get("authorization");
      const token = extractTokenFromHeader(authHeader);

      if (token) {
        const payload = verifyToken(token);
        if (payload) {
          const authenticatedRequest = request as AuthenticatedRequest;
          authenticatedRequest.user = payload;
        }
      }

      return handler(request as AuthenticatedRequest, context);
    } catch (error) {
      logger.error("Optional auth middleware error:", {
        message:
          error instanceof Error
            ? error.message
            : "Unknown optional auth error",
        name: error instanceof Error ? error.name : "OptionalAuthError",
      });
      return handler(request as AuthenticatedRequest, context);
    }
  };
}
