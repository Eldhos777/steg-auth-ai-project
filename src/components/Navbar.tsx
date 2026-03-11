import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useState } from "react";

const links = [
  { to: "/", label: "Home" },
  { to: "/generate", label: "Generate Image" },
  { to: "/verify", label: "Verify Image" },
  { to: "/edit", label: "Edit Image" },
];

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4"
    >
      <div className="glass-panel-strong rounded-2xl px-4 py-3 flex items-center justify-between w-full max-w-5xl">
        <Link 
          to="/" 
          className="flex items-center gap-2 font-semibold text-foreground shrink-0"
        >
          <Shield className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">StegAuth</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {location.pathname === link.to && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={{ type: "spring", duration: 0.4 }}
                />
              )}
              <span className="relative z-10">{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Simple sliding theme toggle */}
          <button
            onClick={toggleTheme}
            className="relative flex h-8 w-14 items-center rounded-full bg-secondary border border-border p-1 transition-colors duration-200"
            aria-label="Toggle theme"
          >
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

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden glass-panel rounded-full h-9 w-9 flex items-center justify-center"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-4 right-4 glass-panel-strong mt-2 rounded-2xl p-3 md:hidden"
          >
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
