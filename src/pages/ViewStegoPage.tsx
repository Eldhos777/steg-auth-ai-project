import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Eye, Loader2 } from "lucide-react";
import PageWrapper from "@/components/PageWrapper";
import GlassCard from "@/components/GlassCard";
import { extractLSBVisualization } from "@/lib/steganography";

const ViewStegoPage = () => {
  const [image, setImage] = useState<string | null>(null);
  const [lsb, setLsb] = useState<string | null>(null);
  const [heatmap, setHeatmap] = useState<string | null>(null);
  const [diff, setDiff] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setImage(src);

      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        const viz = extractLSBVisualization(canvas);
        setLsb(viz.lsbCanvas.toDataURL());
        setHeatmap(viz.heatmapCanvas.toDataURL());
        setDiff(viz.diffCanvas.toDataURL());
        setLoading(false);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const vizCards = [
    { label: "Original Image", src: image },
    { label: "LSB Bit-Plane", src: lsb },
    { label: "Modified Pixel Heatmap", src: heatmap },
    { label: "Pixel Difference Map", src: diff },
  ];

  return (
    <PageWrapper>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2 text-center"
      >
        View Stego Image
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-muted-foreground text-center mb-8"
      >
        Visualize hidden steganographic data layers in images
      </motion.p>

      <div className="max-w-3xl mx-auto">
        <GlassCard delay={0.1} className="mb-6">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full glass-button flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Upload className="h-4 w-4" />
            Upload Image
          </button>
        </GlassCard>

        {loading && (
          <GlassCard>
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Analyzing steganographic layers...</span>
            </div>
          </GlassCard>
        )}

        {image && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vizCards.map((card, i) =>
              card.src ? (
                <GlassCard key={card.label} delay={i * 0.1}>
                  <h3 className="text-sm font-semibold mb-2">{card.label}</h3>
                  <div className="rounded-xl overflow-hidden border border-border">
                    <img src={card.src} alt={card.label} className="w-full" />
                  </div>
                </GlassCard>
              ) : null
            )}
          </div>
        )}

        {!image && !loading && (
          <GlassCard>
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Eye className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Upload an image to visualize its steganographic layers</p>
            </div>
          </GlassCard>
        )}
      </div>
    </PageWrapper>
  );
};

export default ViewStegoPage;
