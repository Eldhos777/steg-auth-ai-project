# Crop-Resistant Watermarking Implementation Plan

## Information Gathered

### Project Structure
- **Tech Stack**: React/Vite, TypeScript, TailwindCSS, Framer Motion
- **Existing Features**: LSB steganography, block-based watermark grid, ELA, tamper detection
- **Current Pages**: GenerateImagePage, EditImagePage, VerifyImagePage, TamperAnalysisPage

### Existing Steganography Library (`src/lib/steganography.ts`)
- `encodeMetadataFixed()` - LSB encoding
- `decodeMetadata()` - LSB decoding
- `embedWatermarkGrid()` - Block markers (16x16)
- `extractWatermarkGrid()` - Extract markers
- `generatePerceptualHash()` - Image hashing
- `analyzePixelDifferences()` - Pixel comparison
- `performErrorLevelAnalysis()` - ELA
- `generateTamperHeatmap()` - Heatmap visualization
- `performTamperAnalysis()` - Complete analysis

## Plan

### Phase 1: Enhance Steganography Library
1. **Add Crop-Resistant Watermark System**
   - Create `embedCropResistantWatermark()` - Embed full watermark redundantly in every block
   - Create `extractCropResistantWatermark()` - Reconstruct watermark from partial blocks
   - Implement majority voting for watermark bit recovery
   - Add `calculateCropPercentage()` - Estimate missing area
   - Add `generateWatermarkRecoveryScore()` - Score based on recovered bits

2. **Add Advanced Features**
   - Create `generateCropHeatmap()` - Visualize removed regions
   - Create `generateAuthenticityCertificate()` - PDF certificate
   - Create `generateVerificationReport()` - JSON/PDF report

### Phase 2: Create Crop-Resistant Watermark Page
1. **New Page: `src/pages/CropResistantWatermarkPage.tsx`**
   - Professional cybersecurity dashboard UI
   - Drag & drop image upload
   - Watermark embedding with progress indicator
   - Visual dashboard with:
     - Watermark Status (Detected/Not Detected)
     - Crop Detection (% missing)
     - Authentication Result (Authentic/Cropped/Tampered)
     - Watermark Recovery Score
     - Crop Heatmap visualization
     - Side-by-side comparison viewer

### Phase 3: Enhance Existing Pages
1. **VerifyImagePage**
   - Improved crop detection with percentage
   - Watermark recovery score display
   - Download verification report button

2. **TamperAnalysisPage**
   - Crop heatmap visualization
   - Authenticity score meter
   - Certificate generator

### Phase 4: Update Navigation
- Add new route in App.tsx
- Add nav link in Navbar.tsx

## Files to Modify/Create

### New Files:
1. `src/pages/CropResistantWatermarkPage.tsx` - New page
2. `src/lib/cropResistantWatermark.ts` - Enhanced watermark library (or extend steganography.ts)

### Modified Files:
1. `src/lib/steganography.ts` - Add new functions
2. `src/App.tsx` - Add route
3. `src/components/Navbar.tsx` - Add nav link

## Dependencies
- No new npm packages needed
- Uses existing: React, Canvas API, existing UI components

## Follow-up Steps
1. Install dependencies (if needed): `npm install` / `bun install`
2. Test the implementation
3. Verify crop-resistant watermark survives cropping

