"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <CardTitle className="text-xl font-semibold">页面未找到</CardTitle>
          <CardDescription>抱歉，您访问的页面不存在或已被移动</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-2">
              404
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              这个页面可能已被删除，或者您输入的地址有误
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            <Link href="/dashboard">
              <Button className="w-full" variant="default">
                <Home className="h-4 w-4 mr-2" />
                返回仪表板
              </Button>
            </Link>

            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回上一页
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">或者尝试以下操作：</p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• 检查网址拼写</li>
              <li>• 从导航菜单重新开始</li>
              <li>• 使用搜索功能查找内容</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
