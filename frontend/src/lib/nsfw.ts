"use client";

import type * as nsfwjsType from "nsfwjs";

let modelPromise: Promise<nsfwjsType.NSFWJS | null> | null = null;

/**
 * Lazy loads NSFWJS model in the client browser using WebGL / WASM.
 * Returns null if executed during SSR or if TensorFlow fails to initialize.
 */
export async function loadNsfwModel(): Promise<nsfwjsType.NSFWJS | null> {
  if (typeof window === "undefined") return null;

  if (!modelPromise) {
    modelPromise = (async () => {
      try {
        const nsfwjs = await import("nsfwjs");
        // Loads optimized MobileNetV2 NSFW classifier
        return await nsfwjs.load();
      } catch (err) {
        console.warn("[NSFWJS] Failed to load client model:", err);
        return null;
      }
    })();
  }

  return modelPromise;
}

export interface NsfwCheckResult {
  isExplicit: boolean;
  reason?: string;
  predictions?: Array<{ className: string; probability: number }>;
}

/**
 * Scans an image File for NSFW / Adult content in the browser before network upload.
 * Dual-tier thresholds:
 * - Porn >= 0.50 -> Reject (hard explicit)
 * - Hentai >= 0.60 -> Reject (illustrated adult content)
 * - Sexy >= 0.85 -> Reject (provocative / explicit nudity)
 */
export async function checkImageSafety(file: File): Promise<NsfwCheckResult> {
  if (typeof window === "undefined" || !file || !file.type.startsWith("image/")) {
    return { isExplicit: false };
  }

  try {
    const model = await loadNsfwModel();
    if (!model) {
      // If client-side model cannot be loaded, gracefully defer to server-side NudeNet
      return { isExplicit: false };
    }

    const img = document.createElement("img");
    const objectUrl = URL.createObjectURL(file);

    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Unable to decode image for moderation check"));
        img.src = objectUrl;
      });

      const predictions = await model.classify(img);
      const predictionMap = Object.fromEntries(
        predictions.map((p) => [p.className, p.probability])
      );

      const pornProb = predictionMap["Porn"] || 0;
      const hentaiProb = predictionMap["Hentai"] || 0;
      const sexyProb = predictionMap["Sexy"] || 0;

      if (pornProb >= 0.50) {
        return {
          isExplicit: true,
          reason: `Image rejected by community filter: Adult content detected (${(pornProb * 100).toFixed(0)}% confidence).`,
          predictions,
        };
      }

      if (hentaiProb >= 0.60) {
        return {
          isExplicit: true,
          reason: `Image rejected by community filter: Illustrated adult content detected (${(hentaiProb * 100).toFixed(0)}% confidence).`,
          predictions,
        };
      }

      if (sexyProb >= 0.85) {
        return {
          isExplicit: true,
          reason: `Image rejected by community filter: Explicit nudity or provocative content detected (${(sexyProb * 100).toFixed(0)}% confidence).`,
          predictions,
        };
      }

      return { isExplicit: false, predictions };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch (err) {
    console.warn("[NSFWJS] Client scan exception, falling back to server NudeNet:", err);
    return { isExplicit: false };
  }
}
