import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, Pencil, Loader2, Download, GripVertical } from "lucide-react";
import PageWrapper from "@/components/PageWrapper";
import GlassCard from "@/components/GlassCard";
import { encodeMetadataFixed } from "@/lib/steganography";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EditImagePage = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const compareRef = useRef<HTMLDivElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setOriginalImage(ev.target?.result as string);
      setEditedImage(null);
    };
    reader.readAsDataURL(file);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !compareRef.current) return;
      const rect = compareRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      setSliderPos((x / rect.width) * 100);
    },
    [isDragging]
  );

  const handleEdit = async () => {
    if (!originalImage || !editPrompt.trim()) {
      toast.error("Please upload an image and enter an editing prompt");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("edit-image", {
        body: { prompt: editPrompt, imageDataUrl: originalImage },
      });

      if (error) throw new Error(error.message || "Image editing failed");
      if (data?.error) throw new Error(data.error);

      const editedUrl = data?.imageDataUrl;
      if (!editedUrl) throw new Error("No edited image returned");

      setEditedImage(editedUrl);
      toast.success("Image edited successfully!");
    } catch {
      toast.error("Editing failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!editedImage) return;

    try {
      // Embed steganographic metadata into the edited image
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new window.Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          resolve();
        };
        img.onerror = () => reject(new Error("Failed to load edited image"));
        img.src = editedImage;
      });

      const result = await encodeMetadataFixed(canvas, {
        user_name: userName || "Anonymous",
        prompt: editPrompt,
      });

      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `stegauth-edited-${result.metadata.image_id}.png`;
      a.click();

      toast.success("Downloaded with embedded authentication metadata!");
    } catch {
      // Fallback: download without metadata
      const a = document.createElement("a");
      a.href = editedImage;
      a.download = "stegauth-edited.png";
      a.click();
    }
  };

  return (
    <PageWrapper>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2 text-center"
      >
        Edit Image
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-muted-foreground text-center mb-8"
      >
        Upload an image and transform it with AI prompts
      </motion.p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard delay={0.1}>
          <h2 className="font-semibold text-lg mb-4">Upload & Edit</h2>

          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full glass-button flex items-center justify-center gap-2 text-sm font-medium mb-4"
          >
            <Upload className="h-4 w-4" />
            Upload Image
          </button>

          {originalImage && (
            <div className="rounded-2xl overflow-hidden mb-4 border border-border">
              <img src={originalImage} alt="Original" className="w-full" />
            </div>
          )}

          <label className="block text-sm font-medium mb-1.5">User Name</label>
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your name (for metadata)"
            className="w-full glass-panel rounded-xl px-4 py-2.5 text-sm mb-4 bg-transparent outline-none focus:ring-2 ring-primary/30"
          />

          <label className="block text-sm font-medium mb-1.5">Editing Prompt</label>
          <textarea
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            placeholder="Turn this into a cartoon style..."
            rows={3}
            className="w-full glass-panel rounded-xl px-4 py-2.5 text-sm mb-4 bg-transparent outline-none resize-none focus:ring-2 ring-primary/30"
          />

          <button
            onClick={handleEdit}
            disabled={loading || !originalImage}
            className="w-full gradient-accent text-primary-foreground rounded-2xl py-3 font-semibold text-sm flex items-center justify-center gap-2 glow-button disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
            {loading ? "Editing..." : "Apply Edit"}
          </button>
        </GlassCard>

        <GlassCard delay={0.2}>
          <h2 className="font-semibold text-lg mb-4">Result</h2>

          {originalImage && editedImage ? (
            <>
              {/* Comparison slider */}
              <div
                ref={compareRef}
                className="relative rounded-2xl overflow-hidden border border-border mb-4 cursor-ew-resize select-none"
                style={{ aspectRatio: "1" }}
                onPointerDown={() => setIsDragging(true)}
                onPointerMove={handlePointerMove}
                onPointerUp={() => setIsDragging(false)}
                onPointerLeave={() => setIsDragging(false)}
              >
                {/* Edited (bottom layer) */}
                <img src={editedImage} alt="Edited" className="absolute inset-0 w-full h-full object-cover" />

                {/* Original (top layer, clipped) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={originalImage}
                    alt="Original"
                    className="h-full object-cover"
                    style={{ width: `${compareRef.current?.offsetWidth || 400}px` }}
                  />
                </div>

                {/* Slider handle */}
                <div
                  className="absolute top-0 bottom-0 flex items-center justify-center"
                  style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
                >
                  <div className="w-0.5 h-full bg-primary-foreground/80" />
                  <motion.div
                    className="absolute flex items-center justify-center w-8 h-8 rounded-full glass-panel-strong shadow-lg"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <GripVertical className="h-4 w-4 text-foreground" />
                  </motion.div>
                </div>

                {/* Labels */}
                <div className="absolute top-3 left-3 glass-panel rounded-lg px-2 py-1 text-xs font-medium">Before</div>
                <div className="absolute top-3 right-3 glass-panel rounded-lg px-2 py-1 text-xs font-medium">After</div>
              </div>

              <button
                onClick={handleDownload}
                className="w-full glass-button flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Download className="h-4 w-4" />
                Download Edited Image
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Pencil className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Edited image will appear here</p>
            </div>
          )}
        </GlassCard>
      </div>
    </PageWrapper>
  );
};

export default EditImagePage;
