"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { useState } from "react";

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useAppStore();
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const handleSearch = (value: string) => {
    setLocalQuery(value);
    setSearchQuery(value);
  };

  return (
    <div className="relative w-64">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="搜索报告..."
        value={localQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-10 pr-4"
      />
    </div>
  );
}
