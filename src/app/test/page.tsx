"use client";

import { useState, useEffect } from "react";

export default function TestPage() {
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("auth_token"));
    setUserInfo(localStorage.getItem("user_info"));
  }, []);

  const clearStorage = () => {
    localStorage.clear();
    setToken(null);
    setUserInfo(null);
    alert("已清除所有localStorage数据");
  };

  const setDemoLogin = () => {
    const demoToken = "demo_token_" + Date.now();
    const demoUser = {
      id: "demo_user",
      email: "demo@wendeal.com",
      username: "演示用户",
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("auth_token", demoToken);
    localStorage.setItem("user_info", JSON.stringify(demoUser));

    setToken(demoToken);
    setUserInfo(JSON.stringify(demoUser));
    alert("演示登录数据已设置");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>测试页面</h1>

      <div style={{ marginBottom: "20px" }}>
        <h2>当前状态</h2>
        <p>
          <strong>Token:</strong> {token || "无"}
        </p>
        <p>
          <strong>用户信息:</strong> {userInfo || "无"}
        </p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h2>操作</h2>
        <button
          onClick={clearStorage}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🧹 清除所有数据
        </button>

        <button
          onClick={setDemoLogin}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🚀 设置演示登录
        </button>
      </div>

      <div>
        <h2>导航</h2>
        <button
          onClick={() => (window.location.href = "/")}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🏠 返回首页
        </button>

        <button
          onClick={() => (window.location.href = "/dashboard")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          📊 去仪表板
        </button>
      </div>
    </div>
  );
}
