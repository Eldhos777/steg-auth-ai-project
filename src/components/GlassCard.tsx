import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

const GlassCard = ({ children, className = "", hover = true, delay = 0 }: GlassCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={hover ? { y: -4, boxShadow: "0 16px 48px hsl(var(--glass-shadow))", transition: { duration: 0.2 } } : undefined}
    className={`glass-panel rounded-3xl p-6 h-full flex flex-col ${className}`}
  >
    {children}
  </motion.div>
);

export default GlassCard;
