"use client";

export default function DebugPage() {
  const testLocalStorage = () => {
    try {
      localStorage.setItem("test", "working");
      const result = localStorage.getItem("test");
      localStorage.removeItem("test");
      alert(
        `localStorage测试: ${result === "working" ? "✅ 正常" : "❌ 异常"}`,
      );
    } catch (error) {
      alert(`localStorage错误: ${error}`);
    }
  };

  const testRedirect = () => {
    try {
      window.location.href = "/test";
    } catch (error) {
      alert(`重定向错误: ${error}`);
    }
  };

  const setTokenAndGo = () => {
    try {
      localStorage.setItem("auth_token", "debug_token_123");
      localStorage.setItem(
        "user_info",
        JSON.stringify({ id: "debug", name: "调试用户" }),
      );
      alert("✅ Token已设置，3秒后跳转...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 3000);
    } catch (error) {
      alert(`设置Token错误: ${error}`);
    }
  };

  const clearAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      alert("✅ 已清除所有数据，即将刷新页面...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      alert(`清除数据错误: ${error}`);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px",
        backgroundColor: "#f5f5f5",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ color: "#333", marginBottom: "30px" }}>🔧 调试诊断页面</h1>

      <div
        style={{
          display: "grid",
          gap: "20px",
          maxWidth: "600px",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        }}
      >
        <button
          onClick={testLocalStorage}
          style={{
            padding: "15px 20px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "500",
          }}
        >
          🧪 测试 localStorage
        </button>

        <button
          onClick={clearAndReload}
          style={{
            padding: "15px 20px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "500",
          }}
        >
          🧹 清除所有数据并刷新
        </button>

        <button
          onClick={setTokenAndGo}
          style={{
            padding: "15px 20px",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "500",
          }}
        >
          🚀 设置Token并跳转仪表板
        </button>

        <button
          onClick={testRedirect}
          style={{
            padding: "15px 20px",
            backgroundColor: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "500",
          }}
        >
          🔄 测试重定向到 /test
        </button>

        <button
          onClick={() => (window.location.href = "/")}
          style={{
            padding: "15px 20px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "500",
          }}
        >
          🏠 返回首页
        </button>

        <button
          onClick={() => console.log("Console测试 - 请打开F12查看")}
          style={{
            padding: "15px 20px",
            backgroundColor: "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "500",
          }}
        >
          📝 测试控制台输出
        </button>
      </div>

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #d1d5db",
        }}
      >
        <h2 style={{ color: "#374151", marginBottom: "15px" }}>🎯 使用说明</h2>
        <ol style={{ color: "#6b7280", lineHeight: "1.6" }}>
          <li>
            <strong>首先</strong>：点击"清除所有数据并刷新"清理环境
          </li>
          <li>
            <strong>然后</strong>：点击"设置Token并跳转仪表板"测试完整流程
          </li>
          <li>
            <strong>如果失败</strong>：依次测试localStorage和重定向功能
          </li>
          <li>
            <strong>查看控制台</strong>：按F12打开开发者工具查看错误信息
          </li>
        </ol>
      </div>
    </div>
  );
}
