import { motion } from "framer-motion";
import { ReactNode } from "react";

const PageWrapper = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    className="min-h-screen pt-24 pb-16 px-4"
  >
    {/* Ambient glow layers */}
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="gradient-glow absolute inset-0" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-20 blur-[120px]"
        style={{ background: "hsl(var(--primary))" }} />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full opacity-15 blur-[100px]"
        style={{ background: "hsl(var(--accent))" }} />
    </div>
    <div className="relative z-10 mx-auto max-w-5xl">{children}</div>
  </motion.div>
);

export default PageWrapper;
