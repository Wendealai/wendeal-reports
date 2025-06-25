"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application Error:", error);

    // In production, you might want to send error reports to a service
    if (process.env.NODE_ENV === "production") {
      // Example: Send to error tracking service
      // sendErrorReport(error)
    }
  }, [error]);

  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-xl font-semibold">出现错误</CardTitle>
          <CardDescription>抱歉，应用程序遇到了一个错误</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && (
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <Button onClick={reset} className="w-full" variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>

            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            如果问题持续存在，请联系技术支持
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
