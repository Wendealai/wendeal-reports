"use client";

import { Report } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Star,
  Clock,
  FileText,
  ExternalLink,
  ArrowLeft,
  Edit,
  StarOff,
  Trash2,
  CheckCircle,
  BookOpen,
  Download,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { ReportEditDialog } from "./ReportEditDialog";
import { safeTextContent } from "@/lib/htmlUtils";
import { FileReplaceDialog } from "./FileReplaceDialog";

interface ReportViewerProps {
  report: Report;
}

export function ReportViewer({ report }: ReportViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [contentBlobUrl, setContentBlobUrl] = useState<string>("");
  const { setSelectedReport, theme, toggleFavorite, deleteReport } =
    useAppStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 创建内容的Blob URL
  useEffect(() => {
    console.log("📄 处理报告内容:", {
      hasContent: !!report.content,
      hasFilePath: !!report.filePath,
      contentLength: report.content?.length || 0,
      filePath: report.filePath,
    });

    if (report.content && report.content.trim()) {
      // 如果有content字段，创建HTML内容
      const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: ${theme === "dark" ? "#e2e8f0" : "#333"};
            background-color: ${theme === "dark" ? "#1e293b" : "#ffffff"};
            min-height: 100vh;
            box-sizing: border-box;
        }
        h1, h2, h3 { color: ${theme === "dark" ? "#60a5fa" : "#2563eb"}; }
        h1 { border-bottom: 2px solid ${theme === "dark" ? "#60a5fa" : "#2563eb"}; padding-bottom: 10px; }
        h2 { margin-top: 30px; }
        .highlight { background-color: ${theme === "dark" ? "#374151" : "#fef3c7"}; padding: 2px 4px; border-radius: 3px; }
        .code-block {
            background-color: ${theme === "dark" ? "#374151" : "#f8fafc"};
            border: 1px solid ${theme === "dark" ? "#475569" : "#e2e8f0"};
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
        }
        th, td {
            border: 1px solid ${theme === "dark" ? "#475569" : "#e2e8f0"};
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: ${theme === "dark" ? "#374151" : "#f8fafc"};
            font-weight: 600;
        }
        a {
            color: ${theme === "dark" ? "#60a5fa" : "#2563eb"};
        }
        blockquote {
            border-left: 4px solid ${theme === "dark" ? "#60a5fa" : "#2563eb"};
            background-color: ${theme === "dark" ? "#374151" : "#f8fafc"};
            padding: 16px;
            margin: 16px 0;
        }
    </style>
</head>
<body>
    ${report.content}
</body>
</html>`;

      const blob = new Blob([fullHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setContentBlobUrl(url);
      console.log("✅ 内容Blob URL创建成功");

      // 清理函数
      return () => {
        URL.revokeObjectURL(url);
        console.log("🗑️ Blob URL已清理");
      };
    } else if (report.filePath && report.filePath.trim()) {
      // 如果有文件路径，使用文件路径
      setContentBlobUrl(report.filePath);
      console.log("📁 使用文件路径:", report.filePath);
    } else {
      // 如果既没有content也没有filePath，创建一个占位符HTML
      const simpleHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
            color: ${theme === "dark" ? "#e2e8f0" : "#333"};
            background-color: ${theme === "dark" ? "#1e293b" : "#ffffff"};
            text-align: center;
            min-height: 100vh;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .placeholder {
            padding: 40px;
            background-color: ${theme === "dark" ? "#374151" : "#f8fafc"};
            border-radius: 8px;
            border: 2px dashed ${theme === "dark" ? "#475569" : "#e2e8f0"};
            max-width: 500px;
            width: 100%;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        h2 {
            color: ${theme === "dark" ? "#94a3b8" : "#64748b"};
            margin-bottom: 16px;
        }
        p {
            color: ${theme === "dark" ? "#94a3b8" : "#64748b"};
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="placeholder">
        <div class="icon">📄</div>
        <h2>暂无内容</h2>
        <p>${report.description || "该报告暂时没有可显示的内容。您可以点击编辑按钮来添加内容。"}</p>
    </div>
</body>
</html>`;

      const blob = new Blob([simpleHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setContentBlobUrl(url);
      console.log("📝 创建占位符内容");

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [
    report.content,
    report.filePath,
    report.title,
    report.description,
    theme,
  ]);

  const getStatusIcon = (status: Report["readStatus"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "reading":
        return (
          <Clock style={{ width: "1rem", height: "1rem", color: "#f59e0b" }} />
        );
      default:
        return (
          <FileText
            style={{
              width: "1rem",
              height: "1rem",
              color: theme === "dark" ? "#94a3b8" : "#64748b",
            }}
          />
        );
    }
  };

  const getStatusText = (status: Report["readStatus"]) => {
    switch (status) {
      case "completed":
        return "已完成";
      case "reading":
        return "阅读中";
      default:
        return "未读";
    }
  };

  const formatDate = (date: Date | string | number) => {
    if (!date) return "未知日期";
    try {
      return new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(date));
    } catch (error) {
      console.error("日期格式化失败:", error);
      return "无效日期";
    }
  };

  const handleOpenInNewTab = () => {
    if (report.filePath && report.filePath.startsWith("data:")) {
      window.open(report.filePath, "_blank");
      return;
    }

    if (report.content) {
      const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
      body { font-family: sans-serif; line-height: 1.6; padding: 2rem; max-width: 800px; margin: 0 auto; }
      h1, h2, h3 { color: #333; }
      pre { background-color: #f4f4f4; padding: 1rem; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }
      code { font-family: monospace; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
      blockquote { border-left: 4px solid #ccc; padding-left: 1rem; color: #666; }
    </style>
</head>
<body>
    <h1>${report.title}</h1>
    <div>${report.content}</div>
</body>
</html>`;
      const blob = new Blob([fullHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } else if (report.filePath) {
      // 假定是相对路径
      window.open(report.filePath, "_blank");
    }
  };

  const handleBack = () => {
    setSelectedReport(null);
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleToggleFavorite = () => {
    toggleFavorite(report.id);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    deleteReport(report.id);
    setSelectedReport(null);
    setShowDeleteConfirm(false);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  if (!report) {
    return <div>报告加载失败或不存在。</div>;
  }

  const {
    id,
    title,
    content,
    description,
    category: categoryId,
    tags,
    createdAt,
    updatedAt,
    isFavorite,
    readStatus,
    filePath,
    wordCount,
  } = report;

  const isHtmlContent =
    (content && content.trim().startsWith("<")) ||
    (filePath &&
      (filePath.startsWith("data:text/html") || filePath.endsWith(".html")));

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
        color: theme === "dark" ? "#ffffff" : "#000000",
      }}
    >
      {/* 顶部信息卡片 */}
      <div
        style={{
          margin: "1.5rem",
          marginBottom: "1rem",
          border: `1px solid ${theme === "dark" ? "#334155" : "#e2e8f0"}`,
          borderRadius: "0.5rem",
          backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
        }}
      >
        <div style={{ padding: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <h1
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    margin: 0,
                    color: theme === "dark" ? "#ffffff" : "#000000",
                  }}
                >
                  {report.title}
                </h1>
                {report.isFavorite && (
                  <Star
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                      color: "#fbbf24",
                      fill: "#fbbf24",
                    }}
                  />
                )}
              </div>

              {/* 描述 */}
              {report.description && (
                <div
                  style={{
                    marginBottom: "1rem",
                    fontSize: "0.95rem",
                    lineHeight: "1.6",
                    color: theme === "dark" ? "#cbd5e1" : "#64748b",
                    fontStyle: "italic",
                  }}
                >
                  {safeTextContent(report.description)}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "1rem",
                  fontSize: "0.875rem",
                  color: theme === "dark" ? "#94a3b8" : "#64748b",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  {getStatusIcon(report.readStatus)}
                  <span>{getStatusText(report.readStatus)}</span>
                </div>
                <span>创建于 {formatDate(report.createdAt)}</span>
                <span>更新于 {formatDate(report.updatedAt)}</span>
                {report.wordCount && (
                  <span>{report.wordCount.toLocaleString()} 字</span>
                )}
                {report.fileSize && (
                  <span>{(report.fileSize / 1024).toFixed(1)} KB</span>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft
                  style={{
                    width: "1rem",
                    height: "1rem",
                    marginRight: "0.5rem",
                  }}
                />
                返回
              </Button>

              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit
                  style={{
                    width: "1rem",
                    height: "1rem",
                    marginRight: "0.5rem",
                  }}
                />
                编辑
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleFavorite}
                style={{ color: report.isFavorite ? "#ca8a04" : undefined }}
              >
                {report.isFavorite ? (
                  <>
                    <StarOff
                      style={{
                        width: "1rem",
                        height: "1rem",
                        marginRight: "0.5rem",
                      }}
                    />
                    取消收藏
                  </>
                ) : (
                  <>
                    <Star
                      style={{
                        width: "1rem",
                        height: "1rem",
                        marginRight: "0.5rem",
                      }}
                    />
                    收藏
                  </>
                )}
              </Button>

              <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                <ExternalLink
                  style={{
                    width: "1rem",
                    height: "1rem",
                    marginRight: "0.5rem",
                  }}
                />
                新标签页打开
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (contentBlobUrl) {
                    const a = document.createElement('a');
                    a.href = contentBlobUrl;
                    a.download = `${report.title}.html`;
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }
                }}
              >
                <Download
                  style={{
                    width: "1rem",
                    height: "1rem",
                    marginRight: "0.5rem",
                  }}
                />
                下载HTML
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                style={{ color: "#ef4444" }}
              >
                <Trash2
                  style={{
                    width: "1rem",
                    height: "1rem",
                    marginRight: "0.5rem",
                  }}
                />
                删除
              </Button>
            </div>
          </div>

          {report.tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                paddingTop: "0.5rem",
              }}
            >
              {report.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    backgroundColor: theme === "dark" ? "#374151" : "#f1f5f9",
                    color: theme === "dark" ? "#e5e7eb" : "#374151",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.25rem",
                    fontSize: "0.75rem",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div
        style={{
          flex: 1,
          margin: "0 1.5rem 1.5rem 1.5rem",
          overflow: "hidden",
          border: `1px solid ${theme === "dark" ? "#334155" : "#e2e8f0"}`,
          borderRadius: "0.5rem",
          backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
        }}
      >
        <div style={{ padding: 0, height: "100%" }}>
          {isHtmlContent ? (
            <iframe
              ref={iframeRef}
              srcDoc={content || ""}
              src={filePath || ""}
              title={title}
              style={{
                width: "100%",
                height: "100%",
                border: 0,
                borderRadius: "0.5rem",
              }}
              onLoad={handleIframeLoad}
              onLoadStart={() => setIsLoading(true)}
              sandbox="allow-same-origin allow-scripts"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted/20">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">不支持的预览格式</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  此文件格式无法直接预览，请尝试在新标签页中打开。
                </p>
                <Button onClick={handleOpenInNewTab} className="mt-4">
                  在新标签页中打开
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 编辑对话框 */}
      <ReportEditDialog
        report={report}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* 添加旋转动画的CSS */}
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

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-xl font-bold mb-4">确认删除</h2>
            <p>确定要删除报告 &quot;{title}&quot; 吗？此操作无法撤销。</p>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={handleConfirmDelete}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
