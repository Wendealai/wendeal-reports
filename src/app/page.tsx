"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createLogger } from "@/lib/logger";

const logger = createLogger("Page");

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    logger.debug("单用户系统，直接跳转到仪表板");
    router.push("/dashboard");
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #f3f3f3",
            borderTop: "3px solid #3498db",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p style={{ color: "#6b7280", fontSize: "14px" }}>
          正在加载 Wendeal Reports...
        </p>
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
