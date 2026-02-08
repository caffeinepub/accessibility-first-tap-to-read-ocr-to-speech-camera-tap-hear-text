import { useEffect, useRef } from 'react';
import { useCamera } from '../camera/useCamera';
import { Button } from './ui/button';

interface CameraPreviewProps {
  onCapture: (imageFile: File) => void;
  isProcessing: boolean;
}

export default function CameraPreview({ onCapture, isProcessing }: CameraPreviewProps) {
  const {
    isActive,
    isSupported,
    error,
    isLoading,
    startCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({
    facingMode: 'environment',
    width: 1920,
    height: 1080,
    quality: 0.95,
    format: 'image/jpeg',
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  const handleTapToCapture = async () => {
    if (!isActive || isProcessing) return;

    const photo = await capturePhoto();
    if (photo) {
      onCapture(photo);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTapToCapture();
    }
  };

  if (isSupported === false) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-8 text-center">
        <div>
          <h1 className="mb-4 text-2xl font-bold text-foreground">Camera Not Supported</h1>
          <p className="text-lg text-muted-foreground">
            Your browser or device does not support camera access.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-8 text-center">
        <div>
          <h1 className="mb-4 text-2xl font-bold text-destructive">Camera Error</h1>
          <p className="mb-6 text-lg text-foreground">{error.message}</p>
          <Button onClick={startCamera} size="lg" className="min-h-[60px] min-w-[200px] text-lg">
            Retry Camera Access
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !isActive) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 text-2xl font-medium text-foreground">Starting Camera...</div>
          <p className="text-lg text-muted-foreground">Please allow camera access</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      onClick={handleTapToCapture}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Tap anywhere to capture image and read text. Camera preview active."
      aria-disabled={isProcessing}
    >
      {/* Video preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
        aria-hidden="true"
      />

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Visual instruction overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-background/80 to-transparent p-6 text-center">
        <p className="text-lg font-medium text-foreground">Tap anywhere to capture and read text</p>
      </div>
    </div>
  );
}
