import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex h-8 w-14 items-center rounded-full bg-secondary border border-border p-1 transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {/* Sliding circle */}
      <div
        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-sm transition-transform duration-200"
        style={{
          transform: theme === "dark" ? "translateX(24px)" : "translateX(0)",
        }}
      >
        {theme === "dark" ? (
          <Moon className="h-3.5 w-3.5 text-primary-foreground" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-primary-foreground" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
