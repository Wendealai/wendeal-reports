"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

interface SimpleCategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function SimpleCategorySelector({
  value,
  onChange,
  disabled = false,
  style = {},
}: SimpleCategorySelectorProps) {
  const { categories, refreshData } = useAppStore();
  const [predefinedNames, setPredefinedNames] = useState<
    Record<string, string>
  >({});
  const [refreshKey, setRefreshKey] = useState(0);

  // 从localStorage加载预定义分类名称，并监听变化
  useEffect(() => {
    const loadPredefinedNames = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("predefined_category_names");
        const baseCategoryNames: Record<string, string> = {
          uncategorized: "📁 未分类",
          "tech-research": "💻 技术研究",
          "market-analysis": "📊 市场分析",
          "product-review": "🔍 产品评测",
          "industry-insights": "🔬 行业洞察",
        };

        const customNames = saved ? JSON.parse(saved) : {};
        const mergedNames = { ...baseCategoryNames, ...customNames };
        setPredefinedNames(mergedNames);
      }
    };

    loadPredefinedNames();

    // 监听localStorage变化和自定义事件
    const handleStorageChange = () => {
      loadPredefinedNames();
      setRefreshKey((prev) => prev + 1);
    };

    const handleCategoryChange = () => {
      loadPredefinedNames();
      setRefreshKey((prev) => prev + 1);
      // 刷新store中的分类数据
      refreshData();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("categoryOrderChanged", handleCategoryChange);
    window.addEventListener("categoryCreated", handleCategoryChange);
    window.addEventListener("categoryUpdated", handleCategoryChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("categoryOrderChanged", handleCategoryChange);
      window.removeEventListener("categoryCreated", handleCategoryChange);
      window.removeEventListener("categoryUpdated", handleCategoryChange);
    };
  }, [refreshData]);

  // 扁平化分类列表
  const flattenCategories = (
    cats: any[],
    level = 0,
  ): Array<{ id: string; name: string; level: number }> => {
    const result: Array<{ id: string; name: string; level: number }> = [];

    cats.forEach((cat) => {
      result.push({
        id: cat.id,
        name: cat.name,
        level,
      });

      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children, level + 1));
      }
    });

    return result;
  };

  const flatCategories = flattenCategories(categories);

  // 获取所有分类选项（合并预定义分类和数据库分类）
  const getAllCategories = () => {
    const result: Array<{ id: string; name: string; level: number }> = [];
    const seenIds = new Set<string>();
    const seenNames = new Set<string>(); // 新增：防止名称重复

    // 首先添加预定义分类（带emoji的版本）
    Object.entries(predefinedNames).forEach(([id, name]) => {
      if (!seenIds.has(id) && !seenNames.has(name)) {
        result.push({ id, name, level: 0 });
        seenIds.add(id);
        seenNames.add(name);
        // 同时记录不带emoji的名称，避免重复
        const nameWithoutEmoji = name.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
        if (nameWithoutEmoji) {
          seenNames.add(nameWithoutEmoji);
        }
      }
    });

    // 然后添加数据库中的其他分类（排除已经在预定义中的和名称重复的）
    flatCategories.forEach((cat) => {
      const cleanName = cat.name.trim();
      
      if (!seenIds.has(cat.id) && !seenNames.has(cleanName)) {
        // 对于自定义分类，检查是否有自定义显示名称
        const customCategories = JSON.parse(
          localStorage.getItem("custom_categories") || "[]",
        );
        const customCategory = customCategories.find(
          (c: any) => c.id === cat.id,
        );
        const displayName = customCategory ? customCategory.label : cleanName;

        // 再次检查显示名称是否重复
        if (!seenNames.has(displayName)) {
          result.push({
            id: cat.id,
            name: displayName,
            level: cat.level,
          });
          seenIds.add(cat.id);
          seenNames.add(displayName);
        }
      }
    });

    return result;
  };

  const allCategories = getAllCategories();

  const defaultStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: disabled ? "#f9fafb" : "white",
    color: "#111827",
    cursor: disabled ? "not-allowed" : "pointer",
    ...style,
  };

  // 添加调试信息
  console.log(
    "SimpleCategorySelector - Categories:",
    allCategories.length,
    allCategories.map((c) => c.name),
  );

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={defaultStyle}
    >
      {allCategories.map((category) => (
        <option key={category.id} value={category.id}>
          {"　".repeat(category.level)}
          {category.name}
        </option>
      ))}
    </select>
  );
}
