"use client";

// 🔧 修复：直接导入Dashboard组件，避免重定向造成的页面闪烁
import DashboardPage from "./dashboard/page";

export default function Home() {
  // 🔧 修复：直接返回Dashboard组件，不进行重定向
  // 这样可以避免页面闪烁和路由跳转的问题
  return <DashboardPage />;
}
