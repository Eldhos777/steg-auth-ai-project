import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Image, Download, MapPin, Loader2, X } from "lucide-react";
import PageWrapper from "@/components/PageWrapper";
import GlassCard from "@/components/GlassCard";
import { encodeMetadataFixed, type ImageMetadata } from "@/lib/steganography";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const GenerateImagePage = () => {
  const [userName, setUserName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const getLocation = useCallback((): Promise<{ latitude: string; longitude: string } | undefined> => {
    if (!locationEnabled) return Promise.resolve(undefined);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) }),
        () => resolve(undefined),
        { timeout: 5000 }
      );
    });
  }, [locationEnabled]);

  const handleCancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    toast.info("Generation cancelled");
  };

  const handleGenerate = async () => {
    if (!userName.trim() || !prompt.trim()) {
      toast.error("Please enter your name and a prompt");
      return;
    }
    setLoading(true);
    setGeneratedImage(null);
    setMetadata(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const location = await getLocation();

      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt },
      });

      if (controller.signal.aborted) return;
      if (error) throw new Error(error.message || "Image generation failed");
      if (data?.error) throw new Error(data.error);

      const imageDataUrl = data?.imageDataUrl;
      if (!imageDataUrl) throw new Error("No image returned");

      const canvas = canvasRef.current!;
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
        img.onerror = () => reject(new Error("Failed to load generated image"));
        img.src = imageDataUrl;
      });

      if (controller.signal.aborted) return;

      const result = await encodeMetadataFixed(canvas, {
        user_name: userName,
        prompt,
        location,
      });

      setMetadata(result.metadata);
      setGeneratedImage(canvas.toDataURL("image/png"));
      toast.success("Image generated with embedded authentication!");
    } catch (err) {
      if (controller.signal.aborted) return;
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement("a");
    a.href = generatedImage;
    a.download = `stegauth-${metadata?.image_id || "image"}.png`;
    a.click();
  };

  return (
    <PageWrapper>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2 text-center"
      >
        Generate AI Image
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-muted-foreground text-center mb-8"
      >
        Create an image and embed invisible authentication metadata
      </motion.p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard delay={0.1}>
          <h2 className="font-semibold text-lg mb-4">Input</h2>

          <label className="block text-sm font-medium mb-1.5">User Name</label>
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your name"
            className="w-full glass-panel rounded-xl px-4 py-2.5 text-sm mb-4 bg-transparent outline-none focus:ring-2 ring-primary/30"
          />

          <label className="block text-sm font-medium mb-1.5">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A cyberpunk cityscape at sunset..."
            rows={4}
            className="w-full glass-panel rounded-xl px-4 py-2.5 text-sm mb-4 bg-transparent outline-none resize-none focus:ring-2 ring-primary/30"
          />

          <label className="flex items-center gap-2 text-sm mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={locationEnabled}
              onChange={(e) => setLocationEnabled(e.target.checked)}
              className="rounded"
            />
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Allow location access
          </label>

          {loading ? (
            <div className="flex gap-3">
              <button
                disabled
                className="flex-1 gradient-accent text-primary-foreground rounded-2xl py-3 font-semibold text-sm flex items-center justify-center gap-2 opacity-80"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </button>
              <button
                onClick={handleCancel}
                className="glass-button flex items-center justify-center gap-2 text-sm font-medium rounded-2xl px-5 py-3 text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              className="w-full gradient-accent text-primary-foreground rounded-2xl py-3 font-semibold text-sm flex items-center justify-center gap-2 glow-button"
            >
              <Image className="h-4 w-4" />
              Generate Image
            </button>
          )}
        </GlassCard>

        <GlassCard delay={0.2}>
          <h2 className="font-semibold text-lg mb-4">Output</h2>

          <canvas ref={canvasRef} className="hidden" />

          {generatedImage ? (
            <>
              <div className="rounded-2xl overflow-hidden mb-4 border border-border">
                <img src={generatedImage} alt="Generated" className="w-full" />
              </div>
              <button
                onClick={handleDownload}
                className="w-full glass-button flex items-center justify-center gap-2 text-sm font-medium mb-6"
              >
                <Download className="h-4 w-4" />
                Download PNG
              </button>
              {metadata && (
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Generated By</span>
                    <span className="font-medium">{metadata.user_name}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Prompt Used</span>
                    <span className="font-medium leading-snug">{metadata.prompt}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Generated On</span>
                    <span className="font-medium">
                      {new Date(metadata.timestamp).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      –{" "}
                      {new Date(metadata.timestamp).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">AI Model</span>
                    <span className="font-medium">{metadata.ai_model}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Image className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Generated image will appear here</p>
            </div>
          )}
        </GlassCard>
      </div>
    </PageWrapper>
  );
};

export default GenerateImagePage;
