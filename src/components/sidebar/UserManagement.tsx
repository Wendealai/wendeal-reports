"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { clearAuthToken } from "@/lib/api-client";

interface UserInfo {
  id: string;
  username: string;
  email: string;
  role?: string;
}

export function UserManagement() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const { theme } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    // 从localStorage获取用户信息
    const token = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("user_info");

    if (token && savedUser) {
      try {
        setUserInfo(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to parse user info:", error);
      }
    }
  }, []);

  const handleLogout = () => {
    // 清除认证信息
    clearAuthToken();
    localStorage.removeItem("user_info");
    localStorage.removeItem("auth_token");

    // 跳转到首页
    router.push("/");

    // 关闭下拉菜单
    setShowDropdown(false);
  };

  const getInitials = (name: string) => {
    if (!name || typeof name !== "string") {
      return "U"; // 默认返回 'U' (User)
    }

    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplay = (role?: string) => {
    switch (role) {
      case "admin":
        return "管理员";
      case "demo":
        return "演示用户";
      default:
        return "用户";
    }
  };

  if (!userInfo) {
    return null;
  }

  return (
    <div
      style={{
        padding: "16px",
        borderTop: `1px solid ${theme === "dark" ? "rgba(51, 65, 85, 0.3)" : "rgba(203, 213, 225, 0.3)"}`,
        position: "relative",
      }}
    >
      {/* 用户信息卡片 */}
      <div
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px",
          borderRadius: "12px",
          background: `linear-gradient(135deg, ${theme === "dark" ? "rgba(51, 65, 85, 0.2)" : "rgba(255, 255, 255, 0.5)"}, ${theme === "dark" ? "rgba(30, 41, 59, 0.2)" : "rgba(241, 245, 249, 0.5)"})`,
          border: `1px solid ${theme === "dark" ? "rgba(51, 65, 85, 0.3)" : "rgba(203, 213, 225, 0.3)"}`,
          cursor: "pointer",
          transition: "all 0.2s ease",
          backdropFilter: "blur(10px)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow =
            theme === "dark"
              ? "0 4px 16px rgba(0, 0, 0, 0.2)"
              : "0 4px 16px rgba(0, 0, 0, 0.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* 头像 */}
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: `linear-gradient(135deg, ${theme === "dark" ? "#60a5fa" : "#3b82f6"}, ${theme === "dark" ? "#34d399" : "#10b981"})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          {getInitials(userInfo.username)}
        </div>

        {/* 用户信息 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: theme === "dark" ? "#e2e8f0" : "#1e293b",
              marginBottom: "2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {userInfo.username}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: theme === "dark" ? "#94a3b8" : "#64748b",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {getRoleDisplay(userInfo.role)}
          </div>
        </div>

        {/* 下拉箭头 */}
        <div
          style={{
            transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            color: theme === "dark" ? "#94a3b8" : "#64748b",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* 下拉菜单 */}
      {showDropdown && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "16px",
            right: "16px",
            marginBottom: "8px",
            backgroundColor:
              theme === "dark"
                ? "rgba(15, 23, 42, 0.95)"
                : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: "12px",
            border: `1px solid ${theme === "dark" ? "rgba(51, 65, 85, 0.3)" : "rgba(203, 213, 225, 0.3)"}`,
            boxShadow:
              theme === "dark"
                ? "0 10px 25px rgba(0, 0, 0, 0.3)"
                : "0 10px 25px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          {/* 用户详细信息 */}
          <div
            style={{
              padding: "16px",
              borderBottom: `1px solid ${theme === "dark" ? "rgba(51, 65, 85, 0.3)" : "rgba(203, 213, 225, 0.3)"}`,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${theme === "dark" ? "#60a5fa" : "#3b82f6"}, ${theme === "dark" ? "#34d399" : "#10b981"})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "16px",
                fontWeight: "600",
                margin: "0 auto 12px",
              }}
            >
              {getInitials(userInfo.username)}
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: theme === "dark" ? "#e2e8f0" : "#1e293b",
                marginBottom: "4px",
              }}
            >
              {userInfo.username}
            </div>
            <div
              style={{
                fontSize: "14px",
                color: theme === "dark" ? "#94a3b8" : "#64748b",
                marginBottom: "4px",
              }}
            >
              {userInfo.email}
            </div>
            <div
              style={{
                fontSize: "12px",
                padding: "4px 8px",
                borderRadius: "6px",
                backgroundColor:
                  userInfo.role === "admin"
                    ? "rgba(34, 197, 94, 0.1)"
                    : "rgba(59, 130, 246, 0.1)",
                color: userInfo.role === "admin" ? "#22c55e" : "#3b82f6",
                display: "inline-block",
              }}
            >
              {getRoleDisplay(userInfo.role)}
            </div>
          </div>

          {/* 登出按钮 */}
          <div style={{ padding: "8px" }}>
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "8px",
                color: "#ef4444",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(239, 68, 68, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
