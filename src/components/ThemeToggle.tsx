"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { createLogger } from "@/lib/logger";

const logger = createLogger("ThemeToggle");

export function ThemeToggle() {
  const { theme, setTheme } = useAppStore();

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    logger.debug("Toggling theme", { from: theme, to: newTheme });
    setTheme(newTheme);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="w-9 h-9 p-0"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">切换主题</span>
    </Button>
  );
}
