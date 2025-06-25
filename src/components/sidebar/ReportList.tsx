"use client";

import { useAppStore } from "@/store/useAppStore";
import { Report } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getReportsByCategory } from "@/data/mockData";
import { useMemo } from "react";
import { Star, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeTextContent } from "@/lib/htmlUtils";

interface ReportListProps {
  categoryId: string;
}

function ReportCard({ report }: { report: Report }) {
  const { selectedReport, setSelectedReport } = useAppStore();
  const isSelected = selectedReport?.id === report.id;

  const getStatusIcon = (status: Report["readStatus"]) => {
    switch (status) {
      case "completed":
        return <Star className="h-3 w-3 text-green-500" />;
      case "reading":
        return <Clock className="h-3 w-3 text-yellow-500" />;
      default:
        return <FileText className="h-3 w-3 text-muted-foreground" />;
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

  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:bg-accent",
        isSelected && "bg-accent border-primary",
      )}
      onClick={() => setSelectedReport(report)}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-medium line-clamp-2 pr-2">
              {report.title}
            </h4>
            {report.isFavorite && (
              <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
            )}
          </div>

          {report.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {safeTextContent(report.description, 100)}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {getStatusIcon(report.readStatus)}
              <span className="text-xs text-muted-foreground">
                {getStatusText(report.readStatus)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {report.wordCount?.toLocaleString()} 字
            </span>
          </div>

          {report.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {report.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs px-1 py-0"
                >
                  {tag}
                </Badge>
              ))}
              {report.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{report.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportList({ categoryId }: ReportListProps) {
  const { reports, searchQuery } = useAppStore();

  const filteredReports = useMemo(() => {
    let result: Report[] = [];

    switch (categoryId) {
      case "favorites":
        result = reports.filter((report) => report.isFavorite);
        break;
      case "recent":
        result = reports
          .filter((report) => report.readStatus !== "unread")
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          )
          .slice(0, 10);
        break;
      case "all":
        result = reports;
        break;
      default:
        result = getReportsByCategory(categoryId);
        break;
    }

    // 应用搜索过滤
    if (searchQuery) {
      result = result.filter(
        (report) =>
          report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          report.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    return result;
  }, [reports, categoryId, searchQuery]);

  if (filteredReports.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">
          {searchQuery ? "没有找到匹配的报告" : "该分类下暂无报告"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-2 overflow-y-auto">
      <div className="text-xs text-muted-foreground px-2 py-1">
        共 {filteredReports.length} 个报告
      </div>
      {filteredReports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}
