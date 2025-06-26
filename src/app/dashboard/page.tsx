"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import {
  mockReports,
  buildCategoryTree,
  calculateReportCounts,
} from "@/data/mockData";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
} from "@dnd-kit/core";
import { processReports } from "@/lib/searchUtils";
import dynamic from "next/dynamic";

const ReportViewer = dynamic(
  () => import("@/components/report-viewer/ReportViewer").then(mod => ({ default: mod.ReportViewer })),
  { ssr: false }
);
import { UploadDialog } from "@/components/upload/UploadDialog";
import { CreateReportDialog } from "@/components/upload/CreateReportDialog";
import { DashboardSidebar } from "@/components/sidebar/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Upload, Settings, FileText } from "lucide-react";
import { safeTextContent } from "@/lib/htmlUtils";

export default function DashboardPage() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateReportDialogOpen, setIsCreateReportDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [draggedReport, setDraggedReport] = useState<any>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [isSSR, setIsSSR] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  const {
    setCategories,
    setReports,
    reports,
    selectedReport,
    selectedCategory,
    setSelectedReport,
    setSelectedCategory,
    batchMode,
    selectedReports,
    theme,
    setTheme,
    updateReport,
    deleteReport,
    addReport,
    searchQuery,
    searchFilters,
    sortOptions,
    loading,
    loadData,
    refreshData,
    setLoading,
    loadPredefinedCategoryNames,
    categories,
  } = useAppStore();

  // 閰嶇疆鎷栨嫿浼犳劅鍣?
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // 澶勭悊鎷栨嫿缁撴潫浜嬩欢 - 鐢ㄤ簬鏂囩珷鎷栨嫿鍒板垎绫?
  const handleDndDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data?.current;
    const overData = over.data?.current;

    // 妫€鏌ユ槸鍚︽槸鎶ュ憡鎷栨嫿鍒板垎绫?
    if (activeData?.type === 'report' && overData?.type === 'category') {
      const report = activeData.report;
      const targetCategoryId = overData.categoryId;
      
      // 濡傛灉鐩爣鍒嗙被涓庡綋鍓嶅垎绫荤浉鍚岋紝涓嶉渶瑕佹洿鏂?
      if (report.category === targetCategoryId) return;

      try {
        setOperationLoading(true);
        console.log('鎷栨嫿鏇存柊鎶ュ憡鍒嗙被:', report.id, '->', targetCategoryId);
        
        await updateReport(report.id, { category: targetCategoryId });
        await refreshData();
        
        console.log('鉁?鎷栨嫿鏇存柊鎴愬姛');
      } catch (error) {
        console.error('鉂?鎷栨嫿鏇存柊澶辫触:', error);
        alert('鏇存柊鎶ュ憡鍒嗙被澶辫触锛岃绋嶅悗閲嶈瘯');
      } finally {
        setOperationLoading(false);
      }
    }
  };

  // 瀹㈡埛绔覆鏌撴鏌ワ紙鏃犺璇侊級
  useEffect(() => {
    setIsClient(true);
    setIsSSR(false);
    setIsAuthenticated(true);
    setAuthLoading(false);

    // 🔧 添加加载超时保护
    const loadTimeout = setTimeout(() => {
      console.log("⚠️ 数据加载超时，强制显示主界面");
      setLoading(false);
    }, 10000); // 10秒超时

    // 鍗曠敤鎴风郴缁燂紝鐩存帴鍔犺浇鏁版嵁
    const loadDashboardData = async () => {
      try {
        console.log("🔧 Dashboard 开始加载数据");
        await loadData();
        console.log("鉁?Dashboard 鏁版嵁鍔犺浇瀹屾垚");
        clearTimeout(loadTimeout); // 成功加载后清除超时

        // 馃殌 淇锛氱Щ闄ゅ己鍒堕噸缃€昏緫锛岄伩鍏嶈鐩栫敤鎴风殑鍒嗙被缂栬緫
        // 娉ㄩ噴鎺夊己鍒惰Е鍙戞洿鏂帮紝璁㊿ustand鑷劧鐨勭姸鎬佽闃呮満鍒跺鐞哢I鏇存柊
        // setTimeout(() => {
        //   window.dispatchEvent(new CustomEvent('categoryOrderChanged'));
        //   console.log('馃摙 閫氱煡sidebar鏇存柊鍒嗙被鏄剧ず');
        // }, 100);
      } catch (error) {
        console.error("鉂?Dashboard 鏁版嵁鍔犺浇澶辫触:", error);
        clearTimeout(loadTimeout);
        setLoading(false); // 失败时也要停止加载状态
      }
    };

    loadDashboardData();

    return () => {
      clearTimeout(loadTimeout);
    };
  }, [loadData, setLoading]);

  // 鐩戝惉鏂囦欢涓婁紶鎴愬姛浜嬩欢
  useEffect(() => {
    const handleForceUpdate = () => {
      console.log("馃攧 鏂囦欢涓婁紶鎴愬姛锛屽己鍒跺埛鏂版姤鍛婂垪琛?..");
      loadData();
    };

    window.addEventListener("forceReportUpdate", handleForceUpdate);

    return () => {
      window.removeEventListener("forceReportUpdate", handleForceUpdate);
    };
  }, [loadData]);

  // 鐩戝惉鍒嗙被鍚嶇О鍙樺寲
  useEffect(() => {
    const handleCategoryChange = () => {
      // 鏇存柊refreshKey鏉ヨЕ鍙戦噸鏂版覆鏌?
      setRefreshKey((prev) => prev + 1);
    };

    // 鐩戝惉localStorage鍙樺寲鍜岃嚜瀹氫箟浜嬩欢
    window.addEventListener("storage", handleCategoryChange);
    window.addEventListener("categoryOrderChanged", handleCategoryChange);

    return () => {
      window.removeEventListener("storage", handleCategoryChange);
      window.removeEventListener("categoryOrderChanged", handleCategoryChange);
    };
  }, []);

  // 鍔ㄦ€佹洿鏂板垎绫绘姤鍛婃暟閲?
  useEffect(() => {
    if (!isClient) return;

    console.log(
      "Reports changed, updating categories. Reports count:",
      reports.length,
    );

    // 鐩存帴浣跨敤store涓殑鍒嗙被鏁版嵁锛屼笉闇€瑕侀噸鏂拌绠?
    // store涓殑鍒嗙被鏁版嵁宸茬粡鏄粠鏁版嵁搴撳姞杞界殑鏈€鏂版暟鎹?
    console.log("Categories already loaded from database:", categories.length);
  }, [reports, categories, isClient]);

  // 搴旂敤鎼滅储銆佽繃婊ゅ拰鎺掑簭
  const { categoryReports, totalCategoryReports } = useMemo(() => {
    if (!isClient) return { categoryReports: [], totalCategoryReports: 0 };

    // 鑾峰彇褰撳墠鍒嗙被鐨勬姤鍛?
    const getCategoryReports = () => {
      if (!selectedCategory) return [];

      switch (selectedCategory) {
        case "favorites":
          return reports.filter((report) => report.isFavorite);
        case "recent":
          return reports
            .filter((report) => report.readStatus !== "unread")
            .sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
            )
            .slice(0, 10);
        case "all":
          return reports;
        case "uncategorized":
          // 鍙樉绀虹湡姝ｇ殑鏈垎绫绘姤鍛婏細categoryId涓?uncategorized'鎴栬€呬负绌?null
          return reports.filter(
            (report) =>
              report.category === "uncategorized" ||
              !report.category ||
              report.category === null ||
              report.category === "",
          );
        default:
          // 鎸夊垎绫籌D绛涢€夛紝纭繚绮剧‘鍖归厤锛岄伩鍏嶉噸澶嶆樉绀?
          return reports.filter(
            (report) => report.category === selectedCategory,
          );
      }
    };

    const baseReports = getCategoryReports();
    const processedReports = processReports(
      baseReports,
      searchQuery,
      searchFilters,
      sortOptions,
    );
    return {
      categoryReports: processedReports,
      totalCategoryReports: baseReports.length,
    };
  }, [
    selectedCategory,
    reports,
    searchQuery,
    searchFilters,
    sortOptions,
    isClient,
  ]);

  const clearStorageAndReload = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("wendeal-reports-storage");
      window.location.reload();
    }
  };

  // 鎸夌姸鎬佸垎缁勬姤鍛?- 涓夊垪甯冨眬鐨勬牳蹇?
  const reportsByStatus = useMemo(() => {
    if (!isClient) return { unread: [], reading: [], completed: [] };

    return {
      unread: categoryReports.filter(
        (report) => report.readStatus === "unread",
      ),
      reading: categoryReports.filter(
        (report) => report.readStatus === "reading",
      ),
      completed: categoryReports.filter(
        (report) => report.readStatus === "completed",
      ),
    };
  }, [categoryReports, isClient]);

  // 鎷栨嫿澶勭悊鍑芥暟 - 鏀逛负寮傛
  const handleStatusChange = async (
    reportId: string,
    newStatus: "unread" | "reading" | "completed",
  ) => {
    if (operationLoading) return;

    setOperationLoading(true);
    try {
      console.log("Updating report status:", reportId, newStatus);
      await updateReport(reportId, {
        readStatus: newStatus,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error updating report status:", error);
      alert(
        `鏇存柊鎶ュ憡鐘舵€佸け璐? ${error instanceof Error ? error.message : "鏈煡閿欒"}`,
      );
    } finally {
      setOperationLoading(false);
    }
  };

  // 瀹夊叏鐨勬姤鍛婇€夋嫨鍑芥暟
  const handleReportSelect = (report: any) => {
    setSelectedReport(report);
  };

  // 鍒犻櫎鎶ュ憡澶勭悊鍑芥暟 - 鏀逛负寮傛
  const handleDeleteReport = async (reportId: string) => {
    if (operationLoading) return;

    const confirmed = window.confirm("确定要删除这个报告吗？");
    if (!confirmed) return;

    setOperationLoading(true);
    try {
      console.log("Deleting report:", reportId);
      await deleteReport(reportId);
      console.log("Report deleted successfully");
    } catch (error) {
      console.error("Error deleting report:", error);
      alert(
        `鍒犻櫎鎶ュ憡澶辫触: ${error instanceof Error ? error.message : "鏈煡閿欒"}`,
      );
    } finally {
      setOperationLoading(false);
    }
  };

  // 鎷栨斁澶勭悊鍑芥暟
  const handleDragStart = (e: React.DragEvent, report: any) => {
    setDraggedReport(report);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", report.id);

    // 娣诲姞鎷栨嫿鏍峰紡
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = "0.5";
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedReport(null);
    setDragOverColumn(null);
    (e.target as HTMLElement).style.opacity = "1";
  };

  const handleDragOver = (
    e: React.DragEvent,
    columnType: "unread" | "reading" | "completed",
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnType);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // 鍙湁褰撶寮€鏁翠釜鍒楀鍣ㄦ椂鎵嶆竻闄ら珮浜?
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (
    e: React.DragEvent,
    newStatus: "unread" | "reading" | "completed",
  ) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedReport && draggedReport.readStatus !== newStatus) {
      handleStatusChange(draggedReport.id, newStatus);
    }
    setDraggedReport(null);
  };

  // 鑾峰彇鍒嗙被鏄剧ず鍚嶇О鐨勫嚱鏁?
  const getCategoryDisplayName = (categoryId: string): string => {
    // 娣诲姞refreshKey渚濊禆锛岀‘淇濆悕绉板彉鍖栨椂閲嶆柊璁＄畻
    const _ = refreshKey;

    // 鐗规畩鍒嗙被
    if (categoryId === "all") return "所有报告";
    if (categoryId === "favorites") return "收藏夹";
    if (categoryId === "recent") return "最近查看";

    // 棰勫畾涔夊垎绫诲悕绉版槧灏?
    const predefinedNames = JSON.parse(
      localStorage.getItem("predefined_category_names") || "{}",
    );
    const baseCategoryNames: Record<string, string> = {
      uncategorized: "📁 未分类",
      "tech-research": "💻 技术研究",
      "market-analysis": "📈 市场分析",
      "product-review": "🔍 产品评测",
      "industry-insights": "🔬 行业洞察",
    };

    // 濡傛灉鏄瀹氫箟鍒嗙被锛屽厛妫€鏌ユ槸鍚︽湁鑷畾涔夊悕绉?
    if (baseCategoryNames[categoryId]) {
      return predefinedNames[categoryId] || baseCategoryNames[categoryId];
    }

    // 浠庤嚜瀹氫箟鍒嗙被涓煡鎵?
    const customCategories = JSON.parse(
      localStorage.getItem("custom_categories") || "[]",
    );
    const customCategory = customCategories.find(
      (cat: any) => cat.id === categoryId,
    );
    if (customCategory) {
      return customCategory.label;
    }

    // 浠嶢PI鑾峰彇鐨勫垎绫讳腑鏌ユ壘
    const apiCategory = categories.find((c) => c.id === categoryId);
    if (apiCategory) {
      return apiCategory.name;
    }

    // 濡傛灉閮芥壘涓嶅埌锛岃繑鍥炲垎绫籌D
    return categoryId;
  };

  // 🔧 修复：简化加载状态判断，避免卡在加载状态
  // 只在真正需要的时候显示加载状态
  if (!isClient) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
          color: theme === "dark" ? "#ffffff" : "#000000",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: "#6366f1",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              animation: "pulse 2s infinite",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "500",
              marginBottom: "0.5rem",
            }}
          >
            正在初始化系统...
          </h2>
          <p style={{ color: theme === "dark" ? "#94a3b8" : "#64748b" }}>
            请稍等片刻
          </p>
        </div>
      </div>
    );
  }

  // 🔧 修复：如果数据正在加载但已经是客户端，显示简化的加载指示器
  if (loading && reports.length === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
          color: theme === "dark" ? "#ffffff" : "#000000",
        }}
      >
        <DashboardSidebar />
        <main
          style={{
            flex: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "3px solid #f3f3f3",
                borderTop: "3px solid #3498db",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <p style={{ color: theme === "dark" ? "#94a3b8" : "#64748b" }}>
              正在加载数据...
            </p>
            {/* 🔧 调试信息 */}
            <div style={{ 
              marginTop: "20px", 
              fontSize: "12px", 
              color: theme === "dark" ? "#64748b" : "#94a3b8",
              textAlign: "left",
              maxWidth: "300px"
            }}>
              <div>isClient: {isClient.toString()}</div>
              <div>loading: {loading.toString()}</div>
              <div>reports.length: {reports.length}</div>
              <div>categories.length: {categories.length}</div>
              <div>selectedCategory: {selectedCategory || "null"}</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 🔧 修复：强制渲染主界面，即使还在加载中
  // 如果有基本数据就显示，避免卡在加载状态
  if (loading && reports.length > 0) {
    console.log("🔧 数据正在加载但有基本数据，继续渲染主界面");
  }

  // 鏈璇佺敤鎴蜂細琚噸瀹氬悜鍒伴椤?
  if (!isAuthenticated) {
    return null;
  }

  // 鍙嫋鎷界殑鎶ュ憡鍗＄墖缁勪欢
  const DraggableReportCard = ({
    report,
    onStatusChange,
  }: {
    report: any;
    onStatusChange?: (status: "unread" | "reading" | "completed") => void;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging,
    } = useDraggable({
      id: report.id,
      data: {
        type: 'report',
        report: report,
      },
    });

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      opacity: isDragging ? 0.5 : 1,
      border: `1px solid ${theme === "dark" ? "#334155" : "#e2e8f0"}`,
      borderRadius: "0.5rem",
      padding: "0.75rem",
      backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
      cursor: operationLoading ? "wait" : "grab",
      marginBottom: "0.5rem",
      transition: isDragging ? "none" : "all 0.2s ease",
      userSelect: "none" as const,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={() => !operationLoading && !isDragging && handleReportSelect(report)}
        onMouseEnter={(e) => {
          if (!isDragging && !operationLoading) {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              theme === "dark"
                ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                : "0 4px 12px rgba(0, 0, 0, 0.1)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging && !operationLoading) {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }
        }}
      >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "0.5rem",
        }}
      >
        <h4
          style={{
            fontWeight: "500",
            fontSize: "0.875rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            flex: 1,
            margin: 0,
          }}
        >
          {report.title}
        </h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteReport(report.id);
          }}
          disabled={operationLoading}
          style={{
            background: "none",
            border: "none",
            color: "#ef4444",
            cursor: operationLoading ? "wait" : "pointer",
            fontSize: "0.875rem",
            padding: "0.25rem",
            marginLeft: "0.5rem",
            opacity: operationLoading ? 0.5 : 1,
          }}
          title="鍒犻櫎鎶ュ憡"
        >
          馃棏锔?
        </button>
      </div>
      {report.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {safeTextContent(report.description, 120)}
        </p>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.625rem",
          color: theme === "dark" ? "#94a3b8" : "#64748b",
        }}
      >
        <span>{report.isFavorite ? "★" : ""}</span>
        {onStatusChange && (
          <div style={{ display: "flex", gap: "0.25rem" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!operationLoading) onStatusChange("unread");
              }}
              disabled={operationLoading}
              style={{
                padding: "2px 4px",
                fontSize: "0.625rem",
                backgroundColor:
                  report.readStatus === "unread" ? "#ef4444" : "transparent",
                color:
                  report.readStatus === "unread"
                    ? "white"
                    : theme === "dark"
                      ? "#94a3b8"
                      : "#64748b",
                border: "none",
                borderRadius: "2px",
                cursor: operationLoading ? "wait" : "pointer",
                opacity: operationLoading ? 0.5 : 1,
              }}
            >
              鏈
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!operationLoading) onStatusChange("reading");
              }}
              disabled={operationLoading}
              style={{
                padding: "2px 4px",
                fontSize: "0.625rem",
                backgroundColor:
                  report.readStatus === "reading" ? "#f59e0b" : "transparent",
                color:
                  report.readStatus === "reading"
                    ? "white"
                    : theme === "dark"
                      ? "#94a3b8"
                      : "#64748b",
                border: "none",
                borderRadius: "2px",
                cursor: operationLoading ? "wait" : "pointer",
                opacity: operationLoading ? 0.5 : 1,
              }}
            >
              闃呰涓?
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!operationLoading) onStatusChange("completed");
              }}
              disabled={operationLoading}
              style={{
                padding: "2px 4px",
                fontSize: "0.625rem",
                backgroundColor:
                  report.readStatus === "completed" ? "#10b981" : "transparent",
                color:
                  report.readStatus === "completed"
                    ? "white"
                    : theme === "dark"
                      ? "#94a3b8"
                      : "#64748b",
                border: "none",
                borderRadius: "2px",
                cursor: operationLoading ? "wait" : "pointer",
                opacity: operationLoading ? 0.5 : 1,
              }}
            >
              宸插畬鎴?
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDndDragEnd}>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          width: "100%",
          backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
          color: theme === "dark" ? "#ffffff" : "#000000",
        }}
      >
        {/* 宸︿晶杈规爮 */}
        <DashboardSidebar />

      {/* 涓诲唴瀹瑰尯鍩?*/}
      <main
        style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* 椤堕儴鏍?*/}
        <header
          style={{
            padding: "1rem",
            borderBottom: `1px solid ${theme === "dark" ? "#334155" : "#e2e8f0"}`,
            backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              {getCategoryDisplayName(selectedCategory || "all")}
            </h2>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {/* 涓婚鍒囨崲鎸夐挳 */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${theme === "dark" ? "rgba(55, 65, 81, 0.8)" : "rgba(209, 213, 219, 0.8)"}`,
                  backgroundColor:
                    theme === "dark"
                      ? "rgba(30, 41, 59, 0.8)"
                      : "rgba(255, 255, 255, 0.9)",
                  color: theme === "dark" ? "#e2e8f0" : "#374151",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backdropFilter: "blur(8px)",
                  boxShadow:
                    theme === "dark"
                      ? "0 1px 3px rgba(0, 0, 0, 0.3)"
                      : "0 1px 3px rgba(0, 0, 0, 0.1)",
                  minWidth: "44px",
                  height: "36px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    theme === "dark"
                      ? "rgba(55, 65, 81, 0.8)"
                      : "rgba(249, 250, 251, 1)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    theme === "dark"
                      ? "0 4px 12px rgba(0, 0, 0, 0.4)"
                      : "0 4px 12px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    theme === "dark"
                      ? "rgba(30, 41, 59, 0.8)"
                      : "rgba(255, 255, 255, 0.9)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    theme === "dark"
                      ? "0 1px 3px rgba(0, 0, 0, 0.3)"
                      : "0 1px 3px rgba(0, 0, 0, 0.1)";
                }}
                title={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
              >
                <span style={{ fontSize: "16px" }}>
                  {theme === "dark" ? "☀️" : "🌙"}
                </span>
              </button>

              <button
                onClick={() => setIsUploadDialogOpen(true)}
                disabled={operationLoading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: operationLoading
                    ? "rgba(156, 163, 175, 0.8)"
                    : `linear-gradient(135deg, ${theme === "dark" ? "rgba(59, 130, 246, 0.8)" : "rgba(59, 130, 246, 0.9)"}, ${theme === "dark" ? "rgba(16, 185, 129, 0.8)" : "rgba(16, 185, 129, 0.9)"})`,
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: operationLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  backdropFilter: "blur(8px)",
                  height: "36px",
                  boxShadow: operationLoading
                    ? "0 1px 3px rgba(0, 0, 0, 0.2)"
                    : theme === "dark"
                      ? "0 2px 8px rgba(59, 130, 246, 0.3)"
                      : "0 2px 8px rgba(59, 130, 246, 0.2)",
                }}
                onMouseEnter={(e) => {
                  if (!operationLoading) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      theme === "dark"
                        ? "0 4px 16px rgba(59, 130, 246, 0.4)"
                        : "0 4px 16px rgba(59, 130, 246, 0.3)";
                    e.currentTarget.style.background = `linear-gradient(135deg, ${theme === "dark" ? "rgba(59, 130, 246, 1)" : "rgba(59, 130, 246, 1)"}, ${theme === "dark" ? "rgba(16, 185, 129, 1)" : "rgba(16, 185, 129, 1)"})`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!operationLoading) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      theme === "dark"
                        ? "0 2px 8px rgba(59, 130, 246, 0.3)"
                        : "0 2px 8px rgba(59, 130, 246, 0.2)";
                    e.currentTarget.style.background = `linear-gradient(135deg, ${theme === "dark" ? "rgba(59, 130, 246, 0.8)" : "rgba(59, 130, 246, 0.9)"}, ${theme === "dark" ? "rgba(16, 185, 129, 0.8)" : "rgba(16, 185, 129, 0.9)"})`;
                  }
                }}
              >
                <Upload style={{ width: "16px", height: "16px" }} />
                涓婁紶鏂版姤鍛?
              </button>

              <button
                onClick={() => setIsCreateReportDialogOpen(true)}
                disabled={operationLoading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: operationLoading
                    ? "rgba(156, 163, 175, 0.8)"
                    : `linear-gradient(135deg, ${theme === "dark" ? "rgba(139, 92, 246, 0.8)" : "rgba(139, 92, 246, 0.9)"}, ${theme === "dark" ? "rgba(236, 72, 153, 0.8)" : "rgba(236, 72, 153, 0.9)"})`,
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: operationLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  backdropFilter: "blur(8px)",
                  height: "36px",
                  boxShadow: operationLoading
                    ? "0 1px 3px rgba(0, 0, 0, 0.2)"
                    : theme === "dark"
                      ? "0 2px 8px rgba(139, 92, 246, 0.3)"
                      : "0 2px 8px rgba(139, 92, 246, 0.2)",
                }}
                onMouseEnter={(e) => {
                  if (!operationLoading) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      theme === "dark"
                        ? "0 4px 16px rgba(139, 92, 246, 0.4)"
                        : "0 4px 16px rgba(139, 92, 246, 0.3)";
                    e.currentTarget.style.background = `linear-gradient(135deg, ${theme === "dark" ? "rgba(139, 92, 246, 1)" : "rgba(139, 92, 246, 1)"}, ${theme === "dark" ? "rgba(236, 72, 153, 1)" : "rgba(236, 72, 153, 1)"})`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!operationLoading) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      theme === "dark"
                        ? "0 2px 8px rgba(139, 92, 246, 0.3)"
                        : "0 2px 8px rgba(139, 92, 246, 0.2)";
                    e.currentTarget.style.background = `linear-gradient(135deg, ${theme === "dark" ? "rgba(139, 92, 246, 0.8)" : "rgba(139, 92, 246, 0.9)"}, ${theme === "dark" ? "rgba(236, 72, 153, 0.8)" : "rgba(236, 72, 153, 0.9)"})`;
                  }
                }}
              >
                <FileText style={{ width: "16px", height: "16px" }} />
                鏂板鎶ュ憡
              </button>
            </div>
          </div>
        </header>

        {/* 鍐呭鍖哄煙 */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {selectedReport ? (
            <ReportViewer report={selectedReport!} />
          ) : selectedCategory && categoryReports.length > 0 ? (
            /* 涓夊垪鐪嬫澘甯冨眬 */
            <div style={{ height: "100%", overflow: "hidden" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "1.5rem",
                  height: "100%",
                  padding: "1.5rem",
                }}
              >
                {/* 鏈鍒?*/}
                <div
                  onDragOver={(e) => handleDragOver(e, "unread")}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, "unread")}
                  style={{
                    backgroundColor:
                      dragOverColumn === "unread"
                        ? theme === "dark"
                          ? "#374151"
                          : "#f1f5f9"
                        : theme === "dark"
                          ? "#1e293b"
                          : "#f8fafc",
                    borderRadius: "0.5rem",
                    border:
                      dragOverColumn === "unread"
                        ? `2px dashed ${theme === "dark" ? "#60a5fa" : "#3b82f6"}`
                        : `1px solid ${theme === "dark" ? "#334155" : "#e2e8f0"}`,
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      padding: "1rem",
                      borderBottom: `1px solid ${theme === "dark" ? "#334155" : "#e2e8f0"}`,
                      backgroundColor: theme === "dark" ? "#374151" : "#ffffff",
                      borderRadius: "0.5rem 0.5rem 0 0",
                    }}
                  >
                    <h3
                      style={{ fontSize: "1rem", fontWeight: "600", margin: 0 }}
                    >
                      馃搵 鏈槄璇?({reportsByStatus.unread.length})
                    </h3>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: "1rem",
                      overflowY: "auto",
                      maxHeight: "calc(100vh - 200px)",
                      minHeight: "200px",
                    }}
                  >
                    {reportsByStatus.unread.map((report) => (
                      <DraggableReportCard
                        key={report.id}
                        report={report}
                        onStatusChange={(status) =>
                          handleStatusChange(report.id, status as any)
                        }
                      />
                    ))}
                    {reportsByStatus.unread.length === 0 && (
                      <div
                        style={{
                          textAlign: "center",
                          color: theme === "dark" ? "#64748b" : "#94a3b8",
                          fontSize: "0.875rem",
                          marginTop: "2rem",
                        }}
                      >
                        鎷栨嫿鎶ュ憡鍒拌繖閲岃涓烘湭璇?
                      </div>
                    )}
                  </div>
                </div>

                {/* 闃呰涓垪 */}
                <div
                  onDragOver={(e) => handleDragOver(e, "reading")}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, "reading")}
                  style={{
                    backgroundColor:
                      dragOverColumn === "reading"
                        ? theme === "dark"
                          ? "#451a03"
                          : "#fef3c7"
                        : theme === "dark"
                          ? "#1e293b"
                          : "#fffbeb",
                    borderRadius: "0.5rem",
                    border:
                      dragOverColumn === "reading"
                        ? `2px dashed ${theme === "dark" ? "#fbbf24" : "#f59e0b"}`
                        : `1px solid ${theme === "dark" ? "#334155" : "#fbbf24"}`,
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      padding: "1rem",
                      borderBottom: `1px solid ${theme === "dark" ? "#334155" : "#fbbf24"}`,
                      backgroundColor: theme === "dark" ? "#374151" : "#fef3c7",
                      borderRadius: "0.5rem 0.5rem 0 0",
                    }}
                  >
                    <h3
                      style={{ fontSize: "1rem", fontWeight: "600", margin: 0 }}
                    >
                      馃摉 闃呰涓?({reportsByStatus.reading.length})
                    </h3>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: "1rem",
                      overflowY: "auto",
                      maxHeight: "calc(100vh - 200px)",
                      minHeight: "200px",
                    }}
                  >
                    {reportsByStatus.reading.map((report) => (
                      <DraggableReportCard
                        key={report.id}
                        report={report}
                        onStatusChange={(status) =>
                          handleStatusChange(report.id, status as any)
                        }
                      />
                    ))}
                    {reportsByStatus.reading.length === 0 && (
                      <div
                        style={{
                          textAlign: "center",
                          color: theme === "dark" ? "#64748b" : "#94a3b8",
                          fontSize: "0.875rem",
                          marginTop: "2rem",
                        }}
                      >
                        鎷栨嫿鎶ュ憡鍒拌繖閲岃涓洪槄璇讳腑
                      </div>
                    )}
                  </div>
                </div>

                {/* 宸插畬鎴愬垪 */}
                <div
                  onDragOver={(e) => handleDragOver(e, "completed")}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, "completed")}
                  style={{
                    backgroundColor:
                      dragOverColumn === "completed"
                        ? theme === "dark"
                          ? "#064e3b"
                          : "#dcfce7"
                        : theme === "dark"
                          ? "#1e293b"
                          : "#f0fdf4",
                    borderRadius: "0.5rem",
                    border:
                      dragOverColumn === "completed"
                        ? `2px dashed ${theme === "dark" ? "#10b981" : "#059669"}`
                        : `1px solid ${theme === "dark" ? "#334155" : "#10b981"}`,
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      padding: "1rem",
                      borderBottom: `1px solid ${theme === "dark" ? "#334155" : "#10b981"}`,
                      backgroundColor: theme === "dark" ? "#374151" : "#dcfce7",
                      borderRadius: "0.5rem 0.5rem 0 0",
                    }}
                  >
                    <h3
                      style={{ fontSize: "1rem", fontWeight: "600", margin: 0 }}
                    >
                      鉁?宸插畬鎴?({reportsByStatus.completed.length})
                    </h3>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: "1rem",
                      overflowY: "auto",
                      maxHeight: "calc(100vh - 200px)",
                      minHeight: "200px",
                    }}
                  >
                    {reportsByStatus.completed.map((report) => (
                      <DraggableReportCard
                        key={report.id}
                        report={report}
                        onStatusChange={(status) =>
                          handleStatusChange(report.id, status as any)
                        }
                      />
                    ))}
                    {reportsByStatus.completed.length === 0 && (
                      <div
                        style={{
                          textAlign: "center",
                          color: theme === "dark" ? "#64748b" : "#94a3b8",
                          fontSize: "0.875rem",
                          marginTop: "2rem",
                        }}
                      >
                        鎷栨嫿鎶ュ憡鍒拌繖閲岃涓哄凡瀹屾垚
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "500",
                    marginBottom: "0.5rem",
                  }}
                >
                  娆㈣繋浣跨敤 Wendeal Reports
                </h2>
                <p
                  style={{
                    color: theme === "dark" ? "#94a3b8" : "#64748b",
                    marginBottom: "1rem",
                  }}
                >
                  璇蜂粠宸︿晶閫夋嫨涓€涓垎绫绘煡鐪嬫姤鍛?
                </p>
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: theme === "dark" ? "#94a3b8" : "#64748b",
                  }}
                >
                  <p>鎬绘姤鍛婃暟: {reports.length}</p>
                  <p>褰撳墠涓婚: {theme}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 涓婁紶瀵硅瘽妗?*/}
      <UploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
      />

      {/* 鏂板鎶ュ憡瀵硅瘽妗?*/}
      <CreateReportDialog
        open={isCreateReportDialogOpen}
        onOpenChange={setIsCreateReportDialogOpen}
      />
      </div>
    </DndContext>
  );
}
}
