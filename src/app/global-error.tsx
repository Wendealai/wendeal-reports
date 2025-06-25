"use client"; // Error boundaries must be Client Components

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log critical global errors
  console.error("Global Error:", error);

  // In production, send to error monitoring service
  if (process.env.NODE_ENV === "production") {
    // Send critical error report
    // sendCriticalErrorReport(error)
  }

  return (
    // global-error must include html and body tags
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            padding: "2rem",
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "3rem",
              marginBottom: "1rem",
            }}
          >
            🚨
          </div>

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#1f2937",
              marginBottom: "0.5rem",
            }}
          >
            系统错误
          </h1>

          <p
            style={{
              color: "#6b7280",
              marginBottom: "2rem",
              lineHeight: "1.5",
            }}
          >
            应用程序遇到了一个严重错误。我们正在努力解决这个问题。
          </p>

          {process.env.NODE_ENV === "development" && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "2rem",
                textAlign: "left",
              }}
            >
              <strong style={{ color: "#dc2626" }}>开发模式错误信息:</strong>
              <br />
              <code
                style={{
                  fontSize: "0.875rem",
                  color: "#374151",
                  wordBreak: "break-word",
                }}
              >
                {error.message}
              </code>
              {error.digest && (
                <>
                  <br />
                  <small style={{ color: "#6b7280" }}>
                    Error ID: {error.digest}
                  </small>
                </>
              )}
            </div>
          )}

          <div
            style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
          >
            <button
              onClick={reset}
              style={{
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#2563eb";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#3b82f6";
              }}
            >
              🔄 重新加载
            </button>

            <button
              onClick={() => (window.location.href = "/")}
              style={{
                backgroundColor: "transparent",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
                e.currentTarget.style.borderColor = "#9ca3af";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
            >
              🏠 返回首页
            </button>
          </div>

          <p
            style={{
              fontSize: "0.875rem",
              color: "#9ca3af",
              marginTop: "1.5rem",
            }}
          >
            如果问题持续存在，请刷新页面或联系技术支持
          </p>
        </div>
      </body>
    </html>
  );
}
