import { useState, useCallback, useEffect, useRef } from 'react';

interface UseOnDeviceOcrReturn {
  recognizeText: (imageFile: File) => Promise<string>;
  isProcessing: boolean;
  error: string | null;
}

// Type definitions for Tesseract.js loaded from CDN
interface TesseractWorker {
  recognize: (image: string | HTMLImageElement | HTMLCanvasElement | File) => Promise<{
    data: { text: string };
  }>;
  terminate: () => Promise<void>;
}

interface TesseractModule {
  createWorker: (lang?: string, oem?: number, options?: { logger?: (m: any) => void }) => Promise<TesseractWorker>;
}

declare global {
  interface Window {
    Tesseract?: TesseractModule;
  }
}

let workerInstance: TesseractWorker | null = null;
let workerInitialized = false;
let scriptLoaded = false;
let scriptLoading = false;
let loadPromise: Promise<void> | null = null;

async function loadTesseractScript(): Promise<void> {
  if (scriptLoaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (scriptLoading) return;
    scriptLoading = true;

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.async = true;
    
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
    };
    
    script.onerror = () => {
      scriptLoading = false;
      reject(new Error('Failed to load Tesseract.js from CDN'));
    };
    
    document.head.appendChild(script);
  });

  return loadPromise;
}

async function getWorker(): Promise<TesseractWorker> {
  await loadTesseractScript();

  if (!window.Tesseract) {
    throw new Error('Tesseract.js failed to initialize');
  }

  if (!workerInstance) {
    workerInstance = await window.Tesseract.createWorker('eng', 1, {
      logger: (m) => console.log('OCR:', m),
    });
    workerInitialized = true;
  }
  return workerInstance;
}

export function useOnDeviceOcr(): UseOnDeviceOcrReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const recognizeText = useCallback(async (imageFile: File): Promise<string> => {
    setIsProcessing(true);
    setError(null);

    try {
      const worker = await getWorker();

      // Convert File to data URL for Tesseract
      const imageUrl = URL.createObjectURL(imageFile);

      const {
        data: { text },
      } = await worker.recognize(imageUrl);

      // Clean up the object URL
      URL.revokeObjectURL(imageUrl);

      if (isMountedRef.current) {
        setIsProcessing(false);
      }
      return text.trim();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OCR processing failed';
      if (isMountedRef.current) {
        setError(errorMessage);
        setIsProcessing(false);
      }
      throw new Error(errorMessage);
    }
  }, []);

  return {
    recognizeText,
    isProcessing,
    error,
  };
}
