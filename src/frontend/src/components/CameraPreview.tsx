import { useEffect, useRef, useState, useCallback } from 'react';
import { useCamera } from '../camera/useCamera';
import { Button } from './ui/button';
import CameraStartupFallback from './CameraStartupFallback';

interface CameraPreviewProps {
  onCapture: (imageFile: File) => void;
  isProcessing: boolean;
  onStatusChange?: (status: string) => void;
}

export default function CameraPreview({ onCapture, isProcessing, onStatusChange }: CameraPreviewProps) {
  const {
    isActive,
    isSupported,
    error,
    isLoading,
    startCamera,
    capturePhoto,
    retry,
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
  const [showFallback, setShowFallback] = useState(false);
  const [userFriendlyError, setUserFriendlyError] = useState<string>('');
  const [hasAttemptedStart, setHasAttemptedStart] = useState(false);
  const startupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 2;

  // Preflight checks for secure context and API availability
  const checkPreflightRequirements = useCallback(() => {
    if (!window.isSecureContext) {
      setUserFriendlyError('Camera requires HTTPS. Please access this app over a secure connection.');
      return false;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setUserFriendlyError('Camera is not supported in your browser. Please use a modern browser like Chrome, Safari, or Firefox.');
      return false;
    }
    return true;
  }, []);

  // Map camera errors to user-friendly messages
  const getUserFriendlyErrorMessage = useCallback((cameraError: typeof error): string => {
    if (!cameraError) return '';

    switch (cameraError.type) {
      case 'permission':
        return 'Camera access denied. Please allow camera permission in your browser settings and tap Retry.';
      case 'not-supported':
        return 'Camera is not supported in your browser. Please use a modern browser like Chrome, Safari, or Firefox.';
      case 'not-found':
        return 'No camera found. Please connect a camera and tap Retry.';
      case 'unknown':
      default:
        // Check for common browser error messages
        const msg = cameraError.message.toLowerCase();
        if (msg.includes('timeout')) {
          return 'Camera startup timed out. Please tap Retry to try again.';
        }
        if (msg.includes('in use') || msg.includes('notreadable')) {
          return 'Camera is already in use by another app. Please close other apps using the camera and tap Retry.';
        }
        if (msg.includes('permission') || msg.includes('denied')) {
          return 'Camera access denied. Please allow camera permission in your browser settings and tap Retry.';
        }
        return `Camera error: ${cameraError.message}. Please tap Retry.`;
    }
  }, []);

  // Attempt to start camera with retry logic
  const attemptStart = useCallback(async () => {
    if (!checkPreflightRequirements()) {
      return;
    }

    setHasAttemptedStart(true);
    setShowFallback(false);
    setUserFriendlyError('');

    const success = await startCamera();
    
    if (!success && retryCountRef.current < maxRetries) {
      retryCountRef.current += 1;
      onStatusChange?.(`Camera startup failed, retrying (${retryCountRef.current}/${maxRetries})...`);
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 500));
      await attemptStart();
    }
  }, [startCamera, checkPreflightRequirements, onStatusChange]);

  // Handle retry button click
  const handleRetry = useCallback(async () => {
    retryCountRef.current = 0;
    setUserFriendlyError('');
    onStatusChange?.('Retrying camera access...');
    
    const success = await retry();
    if (success) {
      onStatusChange?.('Camera started successfully');
    }
  }, [retry, onStatusChange]);

  // Handle fallback CTA
  const handleFallbackStart = useCallback(async () => {
    setShowFallback(false);
    retryCountRef.current = 0;
    await attemptStart();
  }, [attemptStart]);

  // Initial startup
  useEffect(() => {
    attemptStart();
  }, [attemptStart]);

  // Startup watchdog: show fallback if camera doesn't start within timeout
  useEffect(() => {
    if (hasAttemptedStart && !isActive && !error && isLoading) {
      // Clear any existing timeout
      if (startupTimeoutRef.current) {
        clearTimeout(startupTimeoutRef.current);
      }

      // Set new timeout
      startupTimeoutRef.current = setTimeout(() => {
        if (!isActive && !error) {
          setShowFallback(true);
          onStatusChange?.('Camera startup delayed. Please tap to start manually.');
        }
      }, 2500); // 2.5 seconds

      return () => {
        if (startupTimeoutRef.current) {
          clearTimeout(startupTimeoutRef.current);
        }
      };
    }
  }, [hasAttemptedStart, isActive, error, isLoading, onStatusChange]);

  // Handle page visibility changes (resume when returning to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasAttemptedStart && !isActive && !error) {
        onStatusChange?.('Resuming camera...');
        retryCountRef.current = 0;
        attemptStart();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasAttemptedStart, isActive, error, attemptStart, onStatusChange]);

  // Update user-friendly error when camera error changes
  useEffect(() => {
    if (error) {
      const friendlyMessage = getUserFriendlyErrorMessage(error);
      setUserFriendlyError(friendlyMessage);
      onStatusChange?.(friendlyMessage);
    }
  }, [error, getUserFriendlyErrorMessage, onStatusChange]);

  // Verify video is actually playing
  useEffect(() => {
    if (isActive && videoRef.current) {
      const video = videoRef.current;
      
      const checkPlayback = () => {
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA or better
          onStatusChange?.('Camera ready. Tap anywhere to capture and read text.');
        }
      };

      video.addEventListener('loadeddata', checkPlayback);
      video.addEventListener('playing', checkPlayback);
      
      // Check immediately in case already loaded
      checkPlayback();

      return () => {
        video.removeEventListener('loadeddata', checkPlayback);
        video.removeEventListener('playing', checkPlayback);
      };
    }
  }, [isActive, videoRef, onStatusChange]);

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

  // Not supported
  if (isSupported === false || userFriendlyError.includes('not supported')) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-8 text-center">
        <div className="max-w-md">
          <h1 className="mb-4 text-2xl font-bold text-foreground">Camera Not Supported</h1>
          <p className="text-lg text-muted-foreground">
            {userFriendlyError || 'Your browser or device does not support camera access. Please use a modern browser like Chrome, Safari, or Firefox.'}
          </p>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error || userFriendlyError) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-8 text-center">
        <div className="max-w-md">
          <h1 className="mb-4 text-2xl font-bold text-destructive">Camera Error</h1>
          <p className="mb-6 text-lg text-foreground" role="alert" aria-live="assertive">
            {userFriendlyError || error?.message}
          </p>
          <Button 
            onClick={handleRetry} 
            size="lg" 
            className="min-h-[60px] min-w-[200px] text-lg"
            disabled={isLoading}
          >
            {isLoading ? 'Retrying...' : 'Retry Camera Access'}
          </Button>
        </div>
      </div>
    );
  }

  // Show fallback CTA if camera hasn't started after timeout
  if (showFallback) {
    return <CameraStartupFallback onStartCamera={handleFallbackStart} isLoading={isLoading} />;
  }

  // Loading state
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

  // Active camera preview
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
      {/* Video preview with explicit dimensions */}
      <div className="h-full w-full" style={{ minHeight: '100%' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          aria-hidden="true"
        />
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Visual instruction overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-background/80 to-transparent p-6 text-center">
        <p className="text-lg font-medium text-foreground">Tap anywhere to capture and read text</p>
      </div>
    </div>
  );
}
