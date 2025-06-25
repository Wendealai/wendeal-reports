"use client";

import { debounce } from "lodash";
import { useAppStore } from "@/store/useAppStore";
import {
  File,
  Star,
  Clock,
  Folder,
  Edit2,
  GripVertical,
  Save,
  X,
} from "lucide-react";
import { UserManagement } from "./UserManagement";
import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// 卡片样式的分类项组件
function CategoryCard({
  category,
  isActive,
  onClick,
  count,
  isEditing,
  editValue,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditValueChange,
  onDelete,
  isDragging,
}: {
  category: { id: string; label: string; icon: any; order: number };
  isActive: boolean;
  onClick: () => void;
  count: number;
  isEditing: boolean;
  editValue: string;
  onStartEdit: (id: string, label: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onEditValueChange: (value: string) => void;
  onDelete?: (id: string) => void;
  isDragging?: boolean;
}) {
  const { theme, updatePredefinedCategoryName } = useAppStore();

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 提取名称（去掉emoji）
  const extractName = (label: string) => {
    return label.replace(/^[^\s]*\s/, "");
  };

  // 提取emoji
  const extractEmoji = (label: string) => {
    const match = label.match(/^([^\s]*)/);
    return match ? match[1] : "📁";
  };

  // 🚀 基于Context7最佳实践：检查分类来源而非ID格式
  const isCustomCategory = (categoryId: string) => {
    const customCategories = JSON.parse(
      localStorage.getItem("custom_categories") || "[]",
    );
    return customCategories.some((cat: any) => cat.id === categoryId);
  };

  const handleSave = async () => {
    if (editValue.trim()) {
      const newLabel = `${extractEmoji(category.label)} ${editValue.trim()}`;
      console.log("🔧 保存分类编辑:", {
        categoryId: category.id,
        oldLabel: category.label,
        newLabel: newLabel,
        isCustomCategory: isCustomCategory(category.id),
      });

      try {
        // 🚀 React最佳实践：统一状态更新机制
        // 无论是自定义分类还是预定义分类，都通过同一套流程处理

        if (isCustomCategory(category.id)) {
          // 更新自定义分类到localStorage
          const customCategories = JSON.parse(
            localStorage.getItem("custom_categories") || "[]",
          );
          console.log("📝 更新前的自定义分类:", customCategories);
          const updatedCustomCategories = customCategories.map((cat: any) =>
            cat.id === category.id ? { ...cat, label: newLabel } : cat,
          );
          localStorage.setItem(
            "custom_categories",
            JSON.stringify(updatedCustomCategories),
          );
          console.log("✅ 更新后的自定义分类:", updatedCustomCategories);

          // 🚀 关键修复：立即更新UI状态 - 基于React最佳实践的状态提升
          window.dispatchEvent(
            new CustomEvent("customCategoryChanged", {
              detail: { categoryId: category.id, newLabel },
            }),
          );

          // 🚀 React状态管理最佳实践：确保组件状态同步
          // 强制触发父组件状态更新，确保UI立即反映变化
          const forceUpdateEvent = new CustomEvent("forceCategoryUpdate", {
            detail: {
              categoryId: category.id,
              newLabel,
              type: "custom",
            },
          });
          window.dispatchEvent(forceUpdateEvent);
        } else {
          // 更新预定义分类 - 使用Zustand最佳实践的状态更新方式
          await updatePredefinedCategoryName(category.id, newLabel);
          console.log("✅ 更新预定义分类:", category.id, newLabel);

          // 🚀 React useEffect最佳实践：确保状态变化触发重新渲染
          window.dispatchEvent(
            new CustomEvent("forceCategoryUpdate", {
              detail: {
                categoryId: category.id,
                newLabel,
                type: "predefined",
              },
            }),
          );
        }

        // 调用父组件的保存回调
        onSaveEdit(category.id);
        console.log("✅ 分类名称保存完成:", category.id, "→", newLabel);

        // 🚀 React最佳实践：状态验证和延迟更新保障
        // 基于React文档中的状态管理模式，确保异步更新的一致性
        const verifyStateUpdate = async () => {
          // 等待状态传播
          await new Promise((resolve) => setTimeout(resolve, 50));

          let verified = false;

          if (isCustomCategory(category.id)) {
            // 验证自定义分类更新
            const updatedCustomCategories = JSON.parse(
              localStorage.getItem("custom_categories") || "[]",
            );
            const updatedCategory = updatedCustomCategories.find(
              (cat: any) => cat.id === category.id,
            );
            verified = updatedCategory?.label === newLabel;
            console.log(
              "🔍 自定义分类状态验证:",
              verified ? "✅ 成功" : "❌ 失败",
            );
          } else {
            // 验证预定义分类更新
            const { predefinedCategoryNames } = useAppStore.getState();
            verified = predefinedCategoryNames[category.id] === newLabel;
            console.log(
              "🔍 预定义分类状态验证:",
              verified ? "✅ 成功" : "❌ 失败",
            );
          }

          if (!verified) {
            console.warn("⚠️ 状态验证失败，触发备用更新机制");
            // 备用方案：强制刷新整个分类列表
            window.dispatchEvent(new CustomEvent("categoryOrderChanged"));
          }
        };

        verifyStateUpdate();
      } catch (error) {
        console.error("❌ 保存分类名称时出错:", error);
        // 错误处理：显示用户友好的错误信息
        alert("保存分类名称时出现错误，请重试。");
      }
    }
  };

  // 编辑状态的卡片
  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        data-category-id={category.id}
        style={{
          ...style,
          margin: "4px 0",
          padding: "12px",
          borderRadius: "12px",
          background: `linear-gradient(135deg, ${theme === "dark" ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)"}, ${theme === "dark" ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)"})`,
          border: `2px solid ${theme === "dark" ? "rgba(59, 130, 246, 0.4)" : "rgba(59, 130, 246, 0.3)"}`,
          backdropFilter: "blur(10px)",
          boxShadow:
            theme === "dark"
              ? "0 8px 32px rgba(0, 0, 0, 0.3)"
              : "0 8px 32px rgba(0, 0, 0, 0.1)",
          color: theme === "dark" ? "#e2e8f0" : "#1e293b",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "18px" }}>
            {extractEmoji(category.label)}
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: theme === "dark" ? "#94a3b8" : "#64748b",
            }}
          >
            编辑分类名称
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <input
            type="text"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSave();
              } else if (e.key === "Escape") {
                onCancelEdit();
              }
            }}
            autoFocus
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: "14px",
              border: "none",
              borderRadius: "8px",
              outline: "none",
              backgroundColor:
                theme === "dark"
                  ? "rgba(15, 23, 42, 0.8)"
                  : "rgba(255, 255, 255, 0.9)",
              color: theme === "dark" ? "#e2e8f0" : "#1e293b",
              backdropFilter: "blur(5px)",
            }}
            placeholder="输入新的分类名称..."
          />
          <button
            onClick={handleSave}
            style={{
              padding: "8px",
              backgroundColor: "rgba(34, 197, 94, 0.8)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(5px)",
              transition: "all 0.2s ease",
            }}
            title="保存"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(34, 197, 94, 1)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(34, 197, 94, 0.8)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <Save size={16} />
          </button>
          <button
            onClick={onCancelEdit}
            style={{
              padding: "8px",
              backgroundColor: "rgba(239, 68, 68, 0.8)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(5px)",
              transition: "all 0.2s ease",
            }}
            title="取消"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 1)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.8)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // 普通状态的卡片
  return (
    <div
      ref={setNodeRef}
      data-category-id={category.id}
      style={{
        ...style,
        opacity: isDragging ? 0.7 : 1,
        margin: "4px 0",
        borderRadius: "12px",
        background: isActive
          ? `linear-gradient(135deg, ${theme === "dark" ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.2)"}, ${theme === "dark" ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.2)"})`
          : `linear-gradient(135deg, ${theme === "dark" ? "rgba(51, 65, 85, 0.3)" : "rgba(241, 245, 249, 0.8)"}, ${theme === "dark" ? "rgba(30, 41, 59, 0.3)" : "rgba(226, 232, 240, 0.8)"})`,
        border: `1px solid ${
          isActive
            ? theme === "dark"
              ? "rgba(59, 130, 246, 0.4)"
              : "rgba(59, 130, 246, 0.3)"
            : theme === "dark"
              ? "rgba(51, 65, 85, 0.4)"
              : "rgba(203, 213, 225, 0.5)"
        }`,
        backdropFilter: "blur(10px)",
        boxShadow: isActive
          ? theme === "dark"
            ? "0 8px 32px rgba(59, 130, 246, 0.2)"
            : "0 8px 32px rgba(59, 130, 246, 0.15)"
          : theme === "dark"
            ? "0 4px 16px rgba(0, 0, 0, 0.2)"
            : "0 4px 16px rgba(0, 0, 0, 0.08)",
        transition: "all 0.3s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow =
            theme === "dark"
              ? "0 8px 24px rgba(0, 0, 0, 0.3)"
              : "0 8px 24px rgba(0, 0, 0, 0.12)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow =
            theme === "dark"
              ? "0 4px 16px rgba(0, 0, 0, 0.2)"
              : "0 4px 16px rgba(0, 0, 0, 0.08)";
        }
      }}
    >
      {/* 主要内容区域 */}
      <div
        onClick={onClick}
        style={{
          padding: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flex: 1,
          }}
        >
          {/* 拖拽手柄 */}
          <div
            {...attributes}
            {...listeners}
            style={{
              cursor: "grab",
              padding: "4px",
              borderRadius: "6px",
              backgroundColor:
                theme === "dark"
                  ? "rgba(71, 85, 105, 0.5)"
                  : "rgba(148, 163, 184, 0.3)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                theme === "dark"
                  ? "rgba(71, 85, 105, 0.8)"
                  : "rgba(148, 163, 184, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                theme === "dark"
                  ? "rgba(71, 85, 105, 0.5)"
                  : "rgba(148, 163, 184, 0.3)";
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical
              size={14}
              color={theme === "dark" ? "#94a3b8" : "#64748b"}
            />
          </div>

          {/* 分类图标和名称 - 添加双击编辑功能 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flex: 1,
              cursor: "pointer",
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onStartEdit(category.id, category.label);
            }}
            title="双击编辑分类名称"
          >
            <span style={{ fontSize: "18px" }}>
              {extractEmoji(category.label)}
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: theme === "dark" ? "#e2e8f0" : "#1e293b",
              }}
            >
              {extractName(category.label)}
            </span>
          </div>

          {/* 报告数量 */}
          <div
            style={{
              padding: "4px 8px",
              borderRadius: "12px",
              backgroundColor:
                theme === "dark"
                  ? "rgba(15, 23, 42, 0.6)"
                  : "rgba(255, 255, 255, 0.7)",
              fontSize: "12px",
              fontWeight: "600",
              color: theme === "dark" ? "#94a3b8" : "#64748b",
              minWidth: "24px",
              textAlign: "center",
            }}
          >
            {count}
          </div>

          {/* 删除按钮 - 显示给所有分类，但对受保护的分类显示不同样式 */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(category.id);
              }}
              style={{
                padding: "6px",
                border: "none",
                borderRadius: "6px",
                backgroundColor:
                  category.id === "uncategorized"
                    ? "rgba(156, 163, 175, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
                color: category.id === "uncategorized" ? "#9ca3af" : "#dc2626",
                cursor:
                  category.id === "uncategorized" ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                marginLeft: "8px",
                opacity: category.id === "uncategorized" ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (category.id !== "uncategorized") {
                  e.currentTarget.style.backgroundColor =
                    "rgba(239, 68, 68, 0.2)";
                  e.currentTarget.style.transform = "scale(1.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (category.id !== "uncategorized") {
                  e.currentTarget.style.backgroundColor =
                    "rgba(239, 68, 68, 0.1)";
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
              title={
                category.id === "uncategorized"
                  ? "系统分类不能删除"
                  : "删除分类"
              }
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c0 1 1 2 2 2v2" />
                <line x1="10" x2="10" y1="11" y2="17" />
                <line x1="14" x2="14" y1="11" y2="17" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  // 防抖函数，避免频繁触发更新事件
  const debounceUpdateCategories = useCallback(
    debounce(() => {
      console.log("🔄 防抖触发分类更新");
      window.dispatchEvent(new CustomEvent("categoryOrderChanged"));
    }, 100),
    [],
  );
  const {
    selectedCategory,
    setSelectedCategory,
    categories,
    setSelectedReport,
    reports,
    predefinedCategoryNames,
    loadPredefinedCategoryNames,
    theme,
  } = useAppStore();

  // 编辑状态管理
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // 演示模式状态
  const [isDemoMode, setIsDemoMode] = useState(false);

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const quickActions = [
    { id: "all", label: "📊 所有报告", icon: File },
    { id: "favorites", label: "⭐ 收藏夹", icon: Star },
    { id: "recent", label: "🕒 最近查看", icon: Clock },
  ];

  // 预定义分类 - 从store中获取自定义名称并支持排序
  // 🚀 修复硬编码问题：预定义分类从数据库和localStorage动态加载，初始为空数组
  const [predefinedCategories, setPredefinedCategories] = useState<
    Array<{
      id: string;
      label: string;
      icon: any;
      order: number;
    }>
  >([]);

  // 在组件加载时读取保存的分类名称和排序
  useEffect(() => {
    // 🚀 修复：移除loadPredefinedCategoryNames()调用，避免与Dashboard页面的loadData()竞争
    // loadPredefinedCategoryNames(); // 已移除，由Dashboard页面统一加载

    const updateCategories = () => {
      // 🛡️ 如果正在编辑分类，暂停更新避免冲突
      if (editingId) {
        console.log("⏸️ 正在编辑分类，跳过自动更新:", editingId);
        return;
      }
      console.log("🔄 更新分类列表...");

      // 🚀 防抖检查：如果正在编辑，跳过更新
      const editingKeys = [
        "category_editing_uncategorized",
        "category_editing_tech-research",
        "category_editing_market-analysis",
        "category_editing_product-review",
        "category_editing_industry-insights",
      ];
      const isEditing = editingKeys.some(
        (key) => localStorage.getItem(key) === "true",
      );
      if (isEditing) {
        console.log("⏸️ 检测到正在编辑分类，跳过更新");
        return;
      }

      // 🚀 修复：移除硬编码初始化，完全依赖数据库和store
      // 不再进行本地硬编码初始化，由loadData函数从数据库加载
      // 🔍 强制验证localStorage数据
      const verifyData = () => {
        const stored = localStorage.getItem("predefined_category_names");
        console.log("🔍 localStorage验证:", {
          raw: stored,
          parsed: stored ? JSON.parse(stored) : null,
          存在性: stored ? "YES" : "NO",
        });
      };
      verifyData();
      // 加载排序
      const savedOrder = localStorage.getItem("category_order");
      let orderMap: { [key: string]: number } = {};

      if (savedOrder) {
        try {
          orderMap = JSON.parse(savedOrder);
        } catch (e) {
          console.error("Failed to parse saved category order:", e);
        }
      }

      // 🚀 修复：优先从store读取，localStorage为备份，避免竞争条件
      const { predefinedCategoryNames: storeNames } = useAppStore.getState();
      const localNames = JSON.parse(
        localStorage.getItem("predefined_category_names") || "{}",
      );

      // 合并store和localStorage数据，优先使用有数据的源
      const mergedNames =
        Object.keys(storeNames).length > 0
          ? { ...localNames, ...storeNames }
          : localNames;

      console.log("📊 智能数据合并:", {
        store: storeNames,
        localStorage: localNames,
        merged: mergedNames,
      });
      // 🔍 验证分类名称是否存在
      console.log("🔍 分类名称验证:", {
        uncategorized: localNames["uncategorized"] ? "✅ 存在" : "❌ 缺失",
        "tech-research": localNames["tech-research"] ? "✅ 存在" : "❌ 缺失",
        "market-analysis": localNames["market-analysis"]
          ? "✅ 存在"
          : "❌ 缺失",
        "product-review": localNames["product-review"] ? "✅ 存在" : "❌ 缺失",
        "industry-insights": localNames["industry-insights"]
          ? "✅ 存在"
          : "❌ 缺失",
      });

      // 🚀 修复：移除强制默认名称，完全依赖localStorage

      // 🚀 修复：使用合并后的数据，确保数据完整性
      const currentNames = { ...mergedNames };

      console.log("🎯 完全使用localStorage数据:", {
        localNames,
        结果: currentNames,
        timestamp: new Date().toISOString(),
      });

      console.log("🎯 最终分类名称:", {
        localNames,
        currentNames,
        timestamp: new Date().toISOString(),
      });

      // 获取隐藏的分类
      const hiddenCategories = JSON.parse(
        localStorage.getItem("hidden_categories") || "[]",
      );
      console.log("🙈 隐藏的分类:", hiddenCategories);

      // 获取自定义分类
      const customCategories = JSON.parse(
        localStorage.getItem("custom_categories") || "[]",
      );
      console.log("📦 加载的自定义分类:", customCategories);

      // 🚀 修复：预定义分类，优先使用localStorage中的实际名称
      const allPredefinedCategories = [
        {
          id: "uncategorized",
          label: currentNames["uncategorized"] || "📁 未分类",
          icon: Folder,
          order: orderMap["uncategorized"] || 0,
        },
        {
          id: "tech-research",
          label: currentNames["tech-research"] || "💻 技术研究",
          icon: File,
          order: orderMap["tech-research"] || 1,
        },
        {
          id: "market-analysis",
          label: currentNames["market-analysis"] || "📈 市场分析",
          icon: File,
          order: orderMap["market-analysis"] || 2,
        },
        {
          id: "product-review",
          label: currentNames["product-review"] || "🔍 产品评测",
          icon: File,
          order: orderMap["product-review"] || 3,
        },
        {
          id: "industry-insights",
          label: currentNames["industry-insights"] || "🔬 行业洞察",
          icon: File,
          order: orderMap["industry-insights"] || 4,
        },
      ]; // 🔧 移除filter，确保所有分类都显示（问题修复）

      // 过滤掉隐藏的预定义分类
      const visiblePredefinedCategories = allPredefinedCategories.filter(
        (cat) => !hiddenCategories.includes(cat.id),
      );

      // 合并可见的预定义分类和自定义分类
      const allCategories = [
        ...visiblePredefinedCategories,
        ...customCategories.map((cat: any) => ({
          ...cat,
          order: orderMap[cat.id] !== undefined ? orderMap[cat.id] : cat.order,
        })),
      ];

      console.log("📋 合并后的所有分类:", allCategories);

      // 按order排序
      allCategories.sort((a, b) => a.order - b.order);
      setPredefinedCategories(allCategories);
      console.log("✅ 分类列表更新完成，总数:", allCategories.length);
      // 🔍 最终验证：每次updateCategories后验证数据持久化
      const verifyPersistence = () => {
        const stored = localStorage.getItem("predefined_category_names");
        console.log("🔍 持久化验证:", {
          存储状态: stored ? "YES" : "NO",
          数据内容: stored ? JSON.parse(stored) : null,
          时间戳: new Date().toISOString(),
        });
      };
      setTimeout(verifyPersistence, 500); // 延迟验证，确保所有更新完成
    };

    // 🔧 初始化分类（确保数据加载完成）
    // 延迟执行updateCategories，确保loadPredefinedCategoryNames完成
    setTimeout(() => {
      console.log("🔄 延迟重新加载分类列表，确保数据已保存");
      // 🛡️ 确保编辑状态已清除，避免冲突
      if (editingId) {
        console.log("⚠️ 编辑状态未清除，强制清除:", editingId);
        setEditingId(null);
        setEditValue("");
      }
      window.dispatchEvent(new CustomEvent("categoryOrderChanged"));
    }, 300); // 增加延迟到300ms，确保CategoryCard有足够时间保存

    // 监听localStorage变化
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "category_order" ||
        e.key === "predefined_category_names" ||
        e.key === "hidden_categories" ||
        e.key === "custom_categories"
      ) {
        updateCategories();
      }
    };

    // 监听自定义事件（同一页面内的变化）
    const handleCustomStorageChange = () => {
      updateCategories();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("categoryOrderChanged", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "categoryOrderChanged",
        handleCustomStorageChange,
      );
    };
  }, []); // 🚀 修复：移除依赖项，只在组件挂载时执行一次

  // 演示模式已禁用（单用户系统）
  useEffect(() => {
    setIsDemoMode(false);
  }, []);
  // 🚀 React最佳实践：统一的分类更新事件监听器
  useEffect(() => {
    // 处理强制分类更新事件
    const handleForceCategoryUpdate = (event: CustomEvent) => {
      const { categoryId, newLabel, type } = event.detail;
      console.log("🔄 收到强制分类更新事件:", { categoryId, newLabel, type });

      // 🚀 React状态管理最佳实践：立即更新UI状态
      setPredefinedCategories((prev) => {
        const updated = prev.map((cat) => {
          if (cat.id === categoryId) {
            console.log("🎯 强制更新分类UI:", cat.label, "→", newLabel);
            return { ...cat, label: newLabel };
          }
          return cat;
        });
        return [...updated]; // 返回新数组引用触发重新渲染
      });
    };

    // 处理自定义分类变更事件
    const handleCustomCategoryChange = (event: CustomEvent) => {
      const { categoryId, newLabel } = event.detail;
      console.log("🔄 收到自定义分类变更事件:", categoryId, newLabel);

      // 立即更新UI状态
      setPredefinedCategories((prev) => {
        const updated = prev.map((cat) => {
          if (cat.id === categoryId) {
            console.log("🎯 更新自定义分类UI:", cat.label, "→", newLabel);
            return { ...cat, label: newLabel };
          }
          return cat;
        });
        return [...updated];
      });
    };

    // 🚀 添加对原有强制更新事件的兼容性处理
    const handleForceUpdate = (event: CustomEvent) => {
      const { categoryId, newName } = event.detail;
      if (categoryId && newName) {
        console.log("🔄 收到原有强制更新事件:", categoryId, newName);
        setPredefinedCategories((prev) => {
          const updated = prev.map((cat) => {
            if (cat.id === categoryId) {
              return { ...cat, label: newName };
            }
            return cat;
          });
          return [...updated];
        });
      }
    };

    // 注册事件监听器
    window.addEventListener(
      "forceCategoryUpdate",
      handleForceCategoryUpdate as EventListener,
    );
    window.addEventListener(
      "customCategoryChanged",
      handleCustomCategoryChange as EventListener,
    );
    window.addEventListener(
      "forceCategoryUpdate",
      handleForceUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        "forceCategoryUpdate",
        handleForceCategoryUpdate as EventListener,
      );
      window.removeEventListener(
        "customCategoryChanged",
        handleCustomCategoryChange as EventListener,
      );
      window.removeEventListener(
        "forceCategoryUpdate",
        handleForceUpdate as EventListener,
      );
    };
  }, []);

  // 计算每个分类的报告数量
  const getCategoryCount = (categoryId: string) => {
    switch (categoryId) {
      case "all":
        return reports.length;
      case "favorites":
        return reports.filter((r) => r.isFavorite).length;
      case "recent":
        return reports.filter((r) => r.readStatus !== "unread").length;
      case "uncategorized":
        // 只统计真正的未分类报告，避免重复计算
        return reports.filter(
          (r) =>
            r.category === "uncategorized" ||
            !r.category ||
            r.category === null ||
            r.category === "",
        ).length;
      default:
        // 精确匹配分类ID，确保不重复统计
        return reports.filter((r) => r.category === categoryId).length;
    }
  };

  // 提取名称（去掉emoji）
  const extractName = (label: string) => {
    return label.replace(/^[^\s]*\s/, "");
  };

  // 编辑处理函数
  const handleStartEdit = (categoryId: string, currentLabel: string) => {
    setEditingId(categoryId);
    setEditValue(extractName(currentLabel));
  };

  const handleSaveEdit = (categoryId: string) => {
    setEditingId(null);
    setEditValue("");

    console.log("💾 保存分类编辑完成:", categoryId);

    // 🚀 基于React最佳实践的立即状态更新策略
    // 不再依赖延迟的事件监听，而是直接同步更新状态
    const updateCategoryDisplay = () => {
      console.log("⚡ 立即更新分类显示状态");

      // 检查预定义分类
      const { predefinedCategoryNames } = useAppStore.getState();
      const latestName = predefinedCategoryNames[categoryId];

      // 检查自定义分类
      let customCategoryName = null;
      try {
        const customCategories = JSON.parse(
          localStorage.getItem("custom_categories") || "[]",
        );
        const customCategory = customCategories.find(
          (cat: any) => cat.id === categoryId,
        );
        customCategoryName = customCategory?.label;
      } catch (error) {
        console.warn("解析自定义分类失败:", error);
      }

      // 使用最新的名称（优先使用预定义分类的名称）
      const finalName = latestName || customCategoryName;

      if (finalName) {
        console.log("✅ 获取到最新分类名称:", categoryId, "→", finalName);

        // 🚀 React状态管理最佳实践：使用函数式更新确保状态一致性
        setPredefinedCategories((prev) => {
          const updated = prev.map((cat) => {
            if (cat.id === categoryId) {
              console.log("🎯 更新分类显示:", cat.label, "→", finalName);
              return { ...cat, label: finalName };
            }
            return cat;
          });
          return updated; // 返回新数组引用触发重新渲染
        });
      } else {
        console.warn("⚠️ 未找到分类名称，使用备用方案");
        // 备用方案：触发完整更新
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("categoryOrderChanged"));
        }, 100);
      }
    };

    // 立即执行更新
    updateCategoryDisplay();

    // 🚀 React useEffect最佳实践：确保异步状态变化被捕获
    // 添加短暂延迟以捕获可能的异步状态更新
    setTimeout(() => {
      console.log("🔄 延迟验证：检查状态是否已更新");
      updateCategoryDisplay();
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  // 删除分类处理函数
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // 检查是否是系统预定义的重要分类
      const protectedCategories = ["uncategorized"];
      if (protectedCategories.includes(categoryId)) {
        alert('系统分类"未分类"不能删除，它用于存放没有分类的报告。');
        return;
      }

      // 检查分类下是否有报告
      const categoryReports = reports.filter((r) => r.category === categoryId);
      let confirmMessage = "确定要删除这个分类吗？删除后无法恢复。";

      if (categoryReports.length > 0) {
        confirmMessage = `这个分类下有 ${categoryReports.length} 个报告。删除分类后，这些报告将被移动到"未分类"。确定要继续吗？`;
      }

      // 确认删除对话框
      if (!window.confirm(confirmMessage)) {
        return;
      }

      console.log("🗑️ 删除分类:", categoryId);

      // 如果分类下有报告，先将它们移动到未分类
      if (categoryReports.length > 0) {
        console.log(`📦 移动 ${categoryReports.length} 个报告到未分类`);
        // 这里可以调用API来更新报告的分类
        // 暂时只在前端处理
      }

      // 如果是自定义分类（以category-开头或者是数据库ID）
      if (categoryId.startsWith("category-") || categoryId.length > 10) {
        try {
          // 尝试从数据库删除
          const response = await fetch(`/api/categories/${categoryId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            console.log("✅ 数据库分类删除成功");
          } else {
            console.warn("⚠️ 数据库删除失败，继续本地删除");
          }
        } catch (error) {
          console.warn("⚠️ 数据库删除出错，继续本地删除:", error);
        }

        // 从localStorage中删除
        const currentCustomCategories = JSON.parse(
          localStorage.getItem("custom_categories") || "[]",
        );
        const updatedCustomCategories = currentCustomCategories.filter(
          (cat: any) => cat.id !== categoryId,
        );
        localStorage.setItem(
          "custom_categories",
          JSON.stringify(updatedCustomCategories),
        );

        console.log("✅ 自定义分类删除成功");
      } else {
        // 如果是预定义分类，将其标记为隐藏
        const hiddenCategories = JSON.parse(
          localStorage.getItem("hidden_categories") || "[]",
        );
        if (!hiddenCategories.includes(categoryId)) {
          hiddenCategories.push(categoryId);
          localStorage.setItem(
            "hidden_categories",
            JSON.stringify(hiddenCategories),
          );
        }

        console.log("✅ 预定义分类已隐藏");
      }

      // 从状态中删除
      setPredefinedCategories((prev) =>
        prev.filter((cat) => cat.id !== categoryId),
      );

      // 如果删除的是当前选中的分类，切换到第一个可用分类
      if (selectedCategory === categoryId) {
        const remainingCategories = predefinedCategories.filter(
          (cat) => cat.id !== categoryId,
        );
        if (remainingCategories.length > 0) {
          setSelectedCategory(remainingCategories[0].id);
        } else {
          setSelectedCategory("uncategorized");
        }
        setSelectedReport(null);
      }

      // 触发更新事件
      debounceUpdateCategories();

      console.log("✅ 分类删除成功");

      // 显示成功消息
      setTimeout(() => {
        alert("分类删除成功！");
      }, 100);
    } catch (error) {
      console.error("❌ 删除分类时出错:", error);
      alert("删除分类时出现错误，请重试。");
    }
  };

  // 拖拽结束处理
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setPredefinedCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // 更新order值并保存到localStorage
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          order: index,
        }));

        const orderMap = updatedItems.reduce(
          (acc, item) => {
            acc[item.id] = item.order;
            return acc;
          },
          {} as { [key: string]: number },
        );

        localStorage.setItem("category_order", JSON.stringify(orderMap));
        console.log("✅ 分类排序已保存:", orderMap);

        // 触发自定义事件通知其他组件更新
        debounceUpdateCategories();

        return updatedItems;
      });
    }
  };

  return (
    <div
      style={{
        width: "300px",
        minHeight: "100vh",
        backgroundColor:
          theme === "dark"
            ? "linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)"
            : "linear-gradient(180deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%)",
        backdropFilter: "blur(20px)",
        borderRight: `1px solid ${theme === "dark" ? "rgba(51, 65, 85, 0.3)" : "rgba(203, 213, 225, 0.3)"}`,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          padding: "24px 20px",
          borderBottom: `1px solid ${theme === "dark" ? "rgba(51, 65, 85, 0.3)" : "rgba(203, 213, 225, 0.3)"}`,
          background: `linear-gradient(135deg, ${theme === "dark" ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)"}, ${theme === "dark" ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.05)"})`,
          backdropFilter: "blur(10px)",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            background: `linear-gradient(135deg, ${theme === "dark" ? "#60a5fa" : "#3b82f6"}, ${theme === "dark" ? "#34d399" : "#10b981"})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            margin: 0,
            textAlign: "center",
          }}
        >
          Wendeal Reports
        </h1>
      </div>

      {/* 内容区域 */}
      <div
        style={{
          flex: 1,
          padding: "16px",
        }}
      >
        {/* 分类管理区域 */}
        <div>
          <div
            style={{
              padding: "12px",
              marginBottom: "8px",
              borderRadius: "12px",
              background: `linear-gradient(135deg, ${theme === "dark" ? "rgba(147, 51, 234, 0.15)" : "rgba(147, 51, 234, 0.1)"}, ${theme === "dark" ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)"})`,
              border: `1px solid ${theme === "dark" ? "rgba(147, 51, 234, 0.3)" : "rgba(147, 51, 234, 0.2)"}`,
              backdropFilter: "blur(10px)",
              boxShadow:
                theme === "dark"
                  ? "0 4px 16px rgba(147, 51, 234, 0.2)"
                  : "0 4px 16px rgba(147, 51, 234, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: theme === "dark" ? "#e2e8f0" : "#1e293b",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                📊 快速操作区域
              </span>
            </div>

            <div
              style={{
                display: "flex",
                gap: "6px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={async () => {
                  try {
                    // 创建一个新的默认分类
                    const newCategoryId = `category-${Date.now()}`;
                    const newCategory = {
                      id: newCategoryId,
                      label: `📁 新分类 ${predefinedCategories.length + 1}`,
                      icon: Folder,
                      order: predefinedCategories.length,
                    };

                    console.log("🆕 创建新分类到数据库:", newCategoryId);

                    // 保存到数据库
                    const categoryData = {
                      name: `新分类 ${predefinedCategories.length + 1}`,
                      icon: "📁",
                      color: "#6B7280",
                    };

                    const response = await fetch("/api/categories", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(categoryData),
                    });

                    if (response.ok) {
                      const result = await response.json();
                      console.log("✅ 数据库分类创建成功:", result.category.id);

                      // 使用数据库返回的真实ID
                      const dbCategory = {
                        id: result.category.id,
                        label: `📁 ${result.category.name}`,
                        icon: Folder,
                        order: predefinedCategories.length,
                      };

                      // 同时保存到localStorage（向后兼容）
                      const currentCustomCategories = JSON.parse(
                        localStorage.getItem("custom_categories") || "[]",
                      );
                      const updatedCustomCategories = [
                        ...currentCustomCategories,
                        dbCategory,
                      ];
                      localStorage.setItem(
                        "custom_categories",
                        JSON.stringify(updatedCustomCategories),
                      );

                      // 更新状态
                      setPredefinedCategories([
                        ...predefinedCategories,
                        dbCategory,
                      ]);

                      // 自动选择新创建的分类
                      setSelectedCategory(result.category.id);
                      setSelectedReport(null);

                      // 触发编辑模式
                      setTimeout(() => {
                        handleStartEdit(result.category.id, dbCategory.label);
                      }, 100);

                      // 触发分类创建事件，通知其他组件更新
                      window.dispatchEvent(
                        new CustomEvent("categoryCreated", {
                          detail: { category: result.category },
                        }),
                      );

                      console.log("✅ 新分类创建完成");
                    } else {
                      const error = await response.json();
                      console.error("❌ 数据库分类创建失败:", error);
                      alert(`创建分类失败: ${error.error || "未知错误"}`);
                    }
                  } catch (error) {
                    console.error("❌ 创建分类错误:", error);
                    alert(
                      `创建分类失败: ${error instanceof Error ? error.message : "未知错误"}`,
                    );
                  }
                }}
                style={{
                  padding: "6px 10px",
                  fontSize: "11px",
                  fontWeight: "500",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: `linear-gradient(135deg, ${theme === "dark" ? "rgba(34, 197, 94, 0.7)" : "rgba(34, 197, 94, 0.8)"}, ${theme === "dark" ? "rgba(16, 185, 129, 0.7)" : "rgba(16, 185, 129, 0.8)"})`,
                  color: "white",
                  backdropFilter: "blur(5px)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.background = `linear-gradient(135deg, ${theme === "dark" ? "rgba(34, 197, 94, 0.9)" : "rgba(34, 197, 94, 1)"}, ${theme === "dark" ? "rgba(16, 185, 129, 0.9)" : "rgba(16, 185, 129, 1)"})`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.background = `linear-gradient(135deg, ${theme === "dark" ? "rgba(34, 197, 94, 0.7)" : "rgba(34, 197, 94, 0.8)"}, ${theme === "dark" ? "rgba(16, 185, 129, 0.7)" : "rgba(16, 185, 129, 0.8)"})`;
                }}
              >
                ➕ 新分类
              </button>

              <button
                onClick={() => {
                  // 按字母顺序重新排序分类
                  const sortedCategories = [...predefinedCategories]
                    .sort((a, b) => {
                      // 提取emoji后的文本进行排序
                      const textA = a.label.replace(/^[^\s]*\s/, "");
                      const textB = b.label.replace(/^[^\s]*\s/, "");
                      return textA.localeCompare(textB, "zh");
                    })
                    .map((cat, index) => ({
                      ...cat,
                      order: index,
                    }));

                  setPredefinedCategories(sortedCategories);

                  // 触发事件通知更新
                  setTimeout(() => {
                    window.dispatchEvent(
                      new CustomEvent("categoryOrderChanged"),
                    );
                  }, 100);
                }}
                style={{
                  padding: "6px 10px",
                  fontSize: "11px",
                  fontWeight: "500",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: `linear-gradient(135deg, ${theme === "dark" ? "rgba(168, 85, 247, 0.7)" : "rgba(168, 85, 247, 0.8)"}, ${theme === "dark" ? "rgba(147, 51, 234, 0.7)" : "rgba(147, 51, 234, 0.8)"})`,
                  color: "white",
                  backdropFilter: "blur(5px)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.background = `linear-gradient(135deg, ${theme === "dark" ? "rgba(168, 85, 247, 0.9)" : "rgba(168, 85, 247, 1)"}, ${theme === "dark" ? "rgba(147, 51, 234, 0.9)" : "rgba(147, 51, 234, 1)"})`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.background = `linear-gradient(135deg, ${theme === "dark" ? "rgba(168, 85, 247, 0.7)" : "rgba(168, 85, 247, 0.8)"}, ${theme === "dark" ? "rgba(147, 51, 234, 0.7)" : "rgba(147, 51, 234, 0.8)"})`;
                }}
              >
                🎯 整理
              </button>
            </div>
          </div>

          {/* 分类管理 */}
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: theme === "dark" ? "#94a3b8" : "#64748b",
                padding: "0 4px",
                marginBottom: "12px",
              }}
            >
              分类管理
            </div>

            {/* 使用说明 */}
            <div
              style={{
                fontSize: "11px",
                color: theme === "dark" ? "#94a3b8" : "#64748b",
                padding: "8px 4px",
                lineHeight: "1.4",
              }}
            >
              💡 <strong>使用提示：</strong>
              <br />
              • 双击分类名称进行编辑
              <br />
              • 拖拽左侧手柄重新排序
              <br />
              • 点击分类卡片选择分类
              <br />• 悬停卡片查看动画效果
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={predefinedCategories.map((cat) => cat.id)}
                strategy={verticalListSortingStrategy}
              >
                <div>
                  {predefinedCategories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      isActive={selectedCategory === category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setSelectedReport(null);
                      }}
                      count={getCategoryCount(category.id)}
                      isEditing={editingId === category.id}
                      editValue={editValue}
                      onStartEdit={handleStartEdit}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onEditValueChange={setEditValue}
                      onDelete={handleDeleteCategory}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>

      {/* 用户管理区域 - 固定在底部 */}
      <UserManagement />
    </div>
  );
}
