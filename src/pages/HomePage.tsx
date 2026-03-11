import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Image, Pencil, CheckCircle, Eye, Lock, Fingerprint, Layers, AlertTriangle, Search } from "lucide-react";
import PageWrapper from "@/components/PageWrapper";
import GlassCard from "@/components/GlassCard";

const features = [
  {
    icon: Lock,
    title: "Invisible Metadata",
    desc: "Hidden authentication data embedded in image pixels using LSB steganography",
  },
  {
    icon: Fingerprint,
    title: "SHA-256 Hashing",
    desc: "Cryptographic hashing ensures metadata integrity and tamper detection",
  },
  {
    icon: Layers,
    title: "Multi-Layer Security",
    desc: "Encryption + hashing + custom encoding creates unbreakable protection",
  },
];

const modules = [
  { to: "/generate", icon: Image, label: "Generate Image", desc: "Create AI images with embedded authentication" },
  { to: "/verify", icon: CheckCircle, label: "Verify Image", desc: "Check hidden metadata and integrity" },
  { to: "/edit", icon: Pencil, label: "Edit Image", desc: "AI-powered image editing with prompt" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const HomePage = () => (
  <PageWrapper>
    {/* Hero */}
    <div className="text-center mb-16">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl gradient-accent"
      >
        <Shield className="h-10 w-10 text-primary-foreground" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
      >
        AI Image{" "}
        <span className="glow-text">Authentication</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
      >
        Embed invisible, encrypted authentication metadata inside AI-generated images
        using LSB steganography. Verify authenticity instantly.
      </motion.p>
    </div>

    {/* Get Started - now at top */}
    <motion.h2
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="text-2xl font-semibold text-center mb-8"
    >
      Get Started
    </motion.h2>

    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16"
    >
      {modules.map((m) => (
        <motion.div key={m.to} variants={item} className="flex">
          <Link to={m.to} className="w-full">
            <GlassCard className="group cursor-pointer w-full">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl gradient-accent p-3 shrink-0">
                  <m.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {m.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">{m.desc}</p>
                </div>
              </div>
            </GlassCard>
          </Link>
        </motion.div>
      ))}
    </motion.div>

    {/* Features - now below Get Started */}
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      {features.map((f) => (
        <motion.div key={f.title} variants={item} className="flex">
          <GlassCard delay={0} className="w-full">
            <f.icon className="h-8 w-8 text-primary mb-3 shrink-0" />
            <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground flex-1">{f.desc}</p>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  </PageWrapper>
);

export default HomePage;
