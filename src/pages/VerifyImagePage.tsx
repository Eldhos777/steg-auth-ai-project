import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, CheckCircle, AlertTriangle, XCircle, Shield, Loader2, Fingerprint, Scissors, Copy } from "lucide-react";
import PageWrapper from "@/components/PageWrapper";
import GlassCard from "@/components/GlassCard";
import { 
  decodeMetadata, 
  analyzeAIProbability,
  generatePerceptualHash,
  verifyCrop,
  calculateImageSimilarity,
  type ImageMetadata,
  type CropVerificationResult
} from "@/lib/steganography";
import { toast } from "sonner";

const VerifyImagePage = () => {
  const [image, setImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [noData, setNoData] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{ probability: number; status: string; details: string[] } | null>(null);
  const [pHash, setPHash] = useState<string | null>(null);
  const [cropResult, setCropResult] = useState<CropVerificationResult | null>(null);
  const [imageSimilarity, setImageSimilarity] = useState<number | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [isDraggingOriginal, setIsDraggingOriginal] = useState(false);
  const [isDraggingCropped, setIsDraggingCropped] = useState(false);
  const [isDraggingSingle, setIsDraggingSingle] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const originalFileRef = useRef<HTMLInputElement>(null);

  // Process a file from drag or click
  const processFile = useCallback(async (file: File, target: 'original' | 'cropped' | 'single') => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    setLoading(true);
    
    if (target !== 'original') {
      setMetadata(null);
      setIsValid(null);
      setNoData(false);
      setAiAnalysis(null);
      setPHash(null);
      setCropResult(null);
      setImageSimilarity(null);
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const src = ev.target?.result as string;

      if (target === 'original') {
        setOriginalImage(src);
        // If we already have a cropped image, run detection
        if (image) {
          await performCropDetection(image, src);
        }
      } else if (target === 'cropped') {
        setImage(src);
        // If we already have original, run detection
        if (originalImage) {
          await performCropDetection(src, originalImage);
        }
      } else {
        setImage(src);
        
        const img = new window.Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);

          // If in crop mode and we have original, run crop detection
          if (cropMode && originalImage) {
            await performCropDetection(src, originalImage);
            setLoading(false);
            return;
          }

          try {
            // Decode main metadata
            const result = await decodeMetadata(canvas);
            if (result) {
              setMetadata(result.metadata);
              setIsValid(result.isValid);
            } else {
              setNoData(true);
            }

            // AI Analysis
            const ai = analyzeAIProbability(canvas);
            setAiAnalysis(ai);

            // Generate perceptual hash
            const hash = generatePerceptualHash(canvas);
            setPHash(hash);

            toast.success("Image analyzed successfully");
          } catch {
            setNoData(true);
          } finally {
            setLoading(false);
          }
        };
        img.src = src;
        return; // Don't set loading false here for single mode
      }
      
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }, [image, originalImage, cropMode]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent, target: 'original' | 'cropped' | 'single') => {
    e.preventDefault();
    e.stopPropagation();
    if (target === 'original') setIsDraggingOriginal(true);
    else if (target === 'cropped') setIsDraggingCropped(true);
    else setIsDraggingSingle(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, target: 'original' | 'cropped' | 'single') => {
    e.preventDefault();
    e.stopPropagation();
    if (target === 'original') setIsDraggingOriginal(false);
    else if (target === 'cropped') setIsDraggingCropped(false);
    else setIsDraggingSingle(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, target: 'original' | 'cropped' | 'single') => {
    e.preventDefault();
    e.stopPropagation();
    if (target === 'original') setIsDraggingOriginal(false);
    else if (target === 'cropped') setIsDraggingCropped(false);
    else setIsDraggingSingle(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0], target);
    }
  }, [processFile]);

  // Click handlers
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file, 'cropped');
    }
  };

  const handleOriginalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file, 'original');
    }
  };

  const handleSingleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file, 'single');
    }
  };

  const performCropDetection = async (croppedSrc: string, originalSrc: string) => {
    const croppedImg = new window.Image();
    const originalImg = new window.Image();

    await new Promise<void>((resolve) => {
      croppedImg.onload = () => resolve();
      croppedImg.src = croppedSrc;
    });

    await new Promise<void>((resolve) => {
      originalImg.onload = () => resolve();
      originalImg.src = originalSrc;
    });

    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = croppedImg.width;
    croppedCanvas.height = croppedImg.height;
    const croppedCtx = croppedCanvas.getContext("2d")!;
    croppedCtx.drawImage(croppedImg, 0, 0);

    const originalCanvas = document.createElement("canvas");
    originalCanvas.width = originalImg.width;
    originalCanvas.height = originalImg.height;
    const originalCtx = originalCanvas.getContext("2d")!;
    originalCtx.drawImage(originalImg, 0, 0);

    // Run crop detection
    const result = verifyCrop(originalCanvas, croppedCanvas);
    setCropResult(result);

    // Calculate similarity
    const similarity = calculateImageSimilarity(originalCanvas, croppedCanvas);
    setImageSimilarity(similarity);

    // Also run metadata check on the cropped image
    try {
      const metadataResult = await decodeMetadata(croppedCanvas);
      if (metadataResult) {
        setMetadata(metadataResult.metadata);
        setIsValid(metadataResult.isValid);
      } else {
        setNoData(true);
      }

      const ai = analyzeAIProbability(croppedCanvas);
      setAiAnalysis(ai);

      const hash = generatePerceptualHash(croppedCanvas);
      setPHash(hash);

      toast.success("Crop detection completed");
    } catch {
      setNoData(true);
    }
  };

  const toggleCropMode = () => {
    setCropMode(!cropMode);
    setOriginalImage(null);
    setCropResult(null);
    setImageSimilarity(null);
    if (!cropMode) {
      toast.info("Crop detection mode: Upload original image first, then the cropped image");
    }
  };

  // Drag-drop zone component
  const DragDropZone = ({ 
    isDragging, 
    hasImage, 
    label, 
    imageSrc, 
    icon: Icon,
    onClick,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop 
  }: { 
    isDragging: boolean; 
    hasImage: boolean; 
    label: string; 
    imageSrc: string | null;
    icon: React.ElementType;
    onClick: () => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  }) => (
    <div
      onClick={onClick}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`
        w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl cursor-pointer
        border-2 border-dashed transition-all duration-200
        ${isDragging 
          ? "border-primary bg-primary/10 scale-[1.02]" 
          : "border-border hover:border-primary/50 hover:bg-muted/50"
        }
        ${hasImage ? "h-auto" : "h-32"}
      `}
    >
      {hasImage && imageSrc ? (
        <div className="w-full">
          <img src={imageSrc} alt={label} className="w-full max-h-48 object-contain rounded-lg" />
        </div>
      ) : (
        <>
          <Icon className={`h-8 w-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
          <span className={`text-sm font-medium ${isDragging ? "text-primary" : "text-muted-foreground"}`}>
            {isDragging ? "Drop image here" : label}
          </span>
          <span className="text-xs text-muted-foreground">Click or drag to upload</span>
        </>
      )}
    </div>
  );

  return (
    <PageWrapper>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-2"
      >
        <h1 className="text-3xl font-bold text-center">
          {cropMode ? "Crop Detection" : "Verify Image"}
        </h1>
        <button
          onClick={toggleCropMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            cropMode 
              ? "bg-primary text-primary-foreground" 
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          <Scissors className="h-4 w-4" />
          {cropMode ? "Exit Crop Mode" : "Crop Detection"}
        </button>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-muted-foreground text-center mb-8"
      >
        {cropMode 
          ? "Compare two images to detect cropping and verify authenticity"
          : "Check if an image contains hidden authentication metadata"
        }
      </motion.p>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Crop Detection Mode UI */}
        {cropMode && (
          <GlassCard delay={0}>
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Original Image</label>
                  <input 
                    ref={originalFileRef} 
                    type="file" 
                    accept="image/*" 
                    onChange={handleOriginalUpload} 
                    className="hidden" 
                  />
                  <DragDropZone
                    isDragging={isDraggingOriginal}
                    hasImage={!!originalImage}
                    label="Upload Original Image"
                    imageSrc={originalImage}
                    icon={Copy}
                    onClick={() => originalFileRef.current?.click()}
                    onDragEnter={(e) => handleDragEnter(e, 'original')}
                    onDragLeave={(e) => handleDragLeave(e, 'original')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'original')}
                  />
                </div>
                <div className="flex items-center justify-center">
                  <div className="h-px w-8 bg-border" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Cropped/Modified Image</label>
                  <input 
                    ref={fileRef} 
                    type="file" 
                    accept="image/*" 
                    onChange={handleUpload} 
                    className="hidden" 
                  />
                  <DragDropZone
                    isDragging={isDraggingCropped}
                    hasImage={!!image}
                    label="Upload Cropped Image"
                    imageSrc={image}
                    icon={Upload}
                    onClick={() => fileRef.current?.click()}
                    onDragEnter={(e) => handleDragEnter(e, 'cropped')}
                    onDragLeave={(e) => handleDragLeave(e, 'cropped')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'cropped')}
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Single Image Upload (Non-Crop Mode) */}
        {!cropMode && (
          <GlassCard delay={0.1}>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleSingleUpload} className="hidden" />
            <DragDropZone
              isDragging={isDraggingSingle}
              hasImage={!!image}
              label="Upload Image to Verify"
              imageSrc={image}
              icon={Upload}
              onClick={() => fileRef.current?.click()}
              onDragEnter={(e) => handleDragEnter(e, 'single')}
              onDragLeave={(e) => handleDragLeave(e, 'single')}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'single')}
            />
          </GlassCard>
        )}

        {loading && (
          <GlassCard>
            <div className="flex items-center justify-center gap-3 py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                {cropMode ? "Analyzing images..." : "Analyzing image..."}
              </span>
            </div>
          </GlassCard>
        )}

        {/* Crop Detection Results */}
        {cropMode && cropResult && (
          <GlassCard delay={0.15}>
            <div className="flex items-center gap-3 mb-4">
              {cropResult.result === "Crop detected" ? (
                <CheckCircle className="h-6 w-6 text-primary" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              )}
              <div>
                <h3 className="font-semibold">
                  {cropResult.result === "Crop detected" ? "Crop Detected" : "No Crop Match"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {cropResult.result === "Crop detected"
                    ? `Found at position (${cropResult.coordinates?.x}, ${cropResult.coordinates?.y})`
                    : "The images do not appear to have a crop relationship"}
                </p>
              </div>
            </div>

            {cropResult.result === "Crop detected" && cropResult.coordinates && cropResult.size && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block mb-1">Crop Position</span>
                  <span className="font-mono">X: {cropResult.coordinates.x}, Y: {cropResult.coordinates.y}</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block mb-1">Crop Size</span>
                  <span className="font-mono">{cropResult.size.width} × {cropResult.size.height}</span>
                </div>
              </div>
            )}

            {imageSimilarity !== null && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Image Similarity</span>
                  <span className="font-semibold">{imageSimilarity.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${imageSimilarity}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${
                      imageSimilarity > 80 ? "bg-green-500" : 
                      imageSimilarity > 50 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                  />
                </div>
              </div>
            )}
          </GlassCard>
        )}

        {/* Metadata Display */}
        {metadata && isValid !== null && !cropMode && (
          <GlassCard delay={0.1}>
            <div className="flex items-center gap-3 mb-4">
              {isValid ? (
                <CheckCircle className="h-6 w-6 text-primary" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-destructive" />
              )}
              <div>
                <h3 className="font-semibold">
                  {isValid ? "Authenticated Image" : "Integrity Warning"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isValid
                    ? "Metadata verified — image is authentic"
                    : "Image integrity may be compromised"}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {([
                ["User Name", metadata.user_name],
                ["Prompt", metadata.prompt],
                ["AI Model", metadata.ai_model],
                ["Timestamp", new Date(metadata.timestamp).toLocaleString()],
                ["Image ID", metadata.image_id],
                ["Hash", metadata.hash],
              ] as [string, string | undefined][]).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">{label}</span>
                  <span className="text-right font-mono text-xs truncate max-w-[280px]">{value || "—"}</span>
                </div>
              ))}
              {metadata.location && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="text-xs font-mono">
                    {metadata.location.latitude}, {metadata.location.longitude}
                  </span>
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {noData && !loading && !cropMode && (
          <GlassCard>
            <div className="flex items-center gap-3 py-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <div>
                <h3 className="font-semibold">No Metadata Found</h3>
                <p className="text-xs text-muted-foreground">
                  No authentication metadata found in this image
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        {aiAnalysis && !cropMode && (
          <GlassCard delay={0.2}>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">AI Detection Analysis</h3>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>AI Probability</span>
                <span className="font-semibold">{aiAnalysis.probability}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${aiAnalysis.probability}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full gradient-accent"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{aiAnalysis.status}</p>
            </div>

            <ul className="space-y-1">
              {aiAnalysis.details.map((d, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  {d}
                </li>
              ))}
            </ul>
          </GlassCard>
        )}

        {/* Perceptual Hash */}
        {pHash && !cropMode && (
          <GlassCard delay={0.25}>
            <div className="flex items-center gap-3 mb-4">
              <Fingerprint className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Image Fingerprint</h3>
            </div>
            <p className="text-xs font-mono text-muted-foreground break-all">
              {pHash}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This perceptual hash (pHash) represents the visual characteristics of the image for similarity detection.
            </p>
          </GlassCard>
        )}
      </div>
    </PageWrapper>
  );
};

export default VerifyImagePage;

