import { useEffect, useRef, useState, useCallback } from 'react';
import { useCamera } from '../camera/useCamera';
import { Button } from './ui/button';
import CameraStartupFallback from './CameraStartupFallback';
import { useCameraPermission } from '../hooks/useCameraPermission';

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

  const { permissionState, checkPermission } = useCameraPermission();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [userFriendlyError, setUserFriendlyError] = useState<string>('');
  const hasAttemptedStartRef = useRef(false);
  const isStartingRef = useRef(false);
  const startupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownFallbackRef = useRef(false);
  const blankPreviewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasAttemptedRestartRef = useRef(false);
  const [isVideoRendering, setIsVideoRendering] = useState(false);

  // Preflight checks for secure context and API availability
  const checkPreflightRequirements = useCallback(() => {
    if (!window.isSecureContext) {
      setUserFriendlyError('Camera requires HTTPS. Please access this app over a secure connection.');
      onStatusChange?.('Camera requires HTTPS. Please access this app over a secure connection.');
      return false;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setUserFriendlyError('Camera is not supported in your browser. Please use a modern browser like Chrome, Safari, or Firefox.');
      onStatusChange?.('Camera is not supported in your browser.');
      return false;
    }
    return true;
  }, [onStatusChange]);

  // Map camera errors to user-friendly messages based on permission state
  const getUserFriendlyErrorMessage = useCallback((cameraError: typeof error): string => {
    if (!cameraError) return '';

    switch (cameraError.type) {
      case 'permission':
        if (permissionState === 'denied') {
          return 'Camera access is blocked. Please enable camera permission in your browser settings and tap Retry.';
        }
        return 'Camera access denied. Please allow camera permission and tap Retry.';
      case 'not-supported':
        return 'Camera is not supported in your browser. Please use a modern browser like Chrome, Safari, or Firefox.';
      case 'not-found':
        return 'No camera found. Please connect a camera and tap Retry.';
      case 'unknown':
      default:
        // Check for common browser error messages
        const msg = cameraError.message.toLowerCase();
        if (msg.includes('timeout')) {
          return 'Camera startup timed out. Please close other apps using the camera and tap Retry.';
        }
        if (msg.includes('in use') || msg.includes('notreadable')) {
          return 'Camera is already in use by another app. Please close other apps using the camera and tap Retry.';
        }
        if (msg.includes('permission') || msg.includes('denied')) {
          if (permissionState === 'denied') {
            return 'Camera access is blocked. Please enable camera permission in your browser settings and tap Retry.';
          }
          return 'Camera access denied. Please allow camera permission and tap Retry.';
        }
        // For granted permission but stream failed
        if (permissionState === 'granted') {
          return 'Camera failed to start. Please close other apps using the camera and tap Retry.';
        }
        return `Camera error: ${cameraError.message}. Please tap Retry.`;
    }
  }, [permissionState]);

  // Attempt to start camera (single attempt, no recursion)
  const attemptStart = useCallback(async () => {
    // Prevent concurrent start attempts
    if (isStartingRef.current) {
      return;
    }

    if (!checkPreflightRequirements()) {
      return;
    }

    isStartingRef.current = true;
    hasAttemptedStartRef.current = true;
    setShowFallback(false);
    setUserFriendlyError('');
    hasShownFallbackRef.current = false;
    hasAttemptedRestartRef.current = false;
    setIsVideoRendering(false);

    onStatusChange?.('Starting camera...');

    const success = await startCamera();
    isStartingRef.current = false;
    
    if (success) {
      onStatusChange?.('Camera started successfully');
      // Clear any pending timeout
      if (startupTimeoutRef.current) {
        clearTimeout(startupTimeoutRef.current);
        startupTimeoutRef.current = null;
      }
      // Check permission state after successful start
      checkPermission();
    } else {
      onStatusChange?.('Camera startup failed');
    }
  }, [startCamera, checkPreflightRequirements, onStatusChange, checkPermission]);

  // Handle retry button click
  const handleRetry = useCallback(async () => {
    setUserFriendlyError('');
    isStartingRef.current = false;
    hasAttemptedRestartRef.current = false;
    setIsVideoRendering(false);
    onStatusChange?.('Retrying camera access...');
    
    const success = await retry();
    if (success) {
      onStatusChange?.('Camera started successfully');
      if (startupTimeoutRef.current) {
        clearTimeout(startupTimeoutRef.current);
        startupTimeoutRef.current = null;
      }
      checkPermission();
    }
  }, [retry, onStatusChange, checkPermission]);

  // Handle fallback CTA
  const handleFallbackStart = useCallback(async () => {
    setShowFallback(false);
    hasShownFallbackRef.current = false;
    isStartingRef.current = false;
    hasAttemptedRestartRef.current = false;
    setIsVideoRendering(false);
    onStatusChange?.('Starting camera...');
    await attemptStart();
  }, [attemptStart, onStatusChange]);

  // Initial startup - only once
  useEffect(() => {
    if (!hasAttemptedStartRef.current) {
      attemptStart();
    }
  }, []);

  // Startup watchdog: show fallback if camera doesn't start within timeout
  useEffect(() => {
    // Arm watchdog when we've attempted start but camera is not active and no error
    if (hasAttemptedStartRef.current && !isActive && !error && !hasShownFallbackRef.current && !isStartingRef.current) {
      // Clear any existing timeout
      if (startupTimeoutRef.current) {
        clearTimeout(startupTimeoutRef.current);
      }

      // Set new timeout
      startupTimeoutRef.current = setTimeout(() => {
        if (!isActive && !error && !hasShownFallbackRef.current) {
          setShowFallback(true);
          hasShownFallbackRef.current = true;
          isStartingRef.current = false;
          onStatusChange?.('Camera startup delayed. Please tap to start manually.');
        }
      }, 3000); // 3 seconds

      return () => {
        if (startupTimeoutRef.current) {
          clearTimeout(startupTimeoutRef.current);
        }
      };
    }
  }, [isActive, error, onStatusChange]);

  // Blank preview watchdog: detect when camera is active but video never renders frames
  useEffect(() => {
    if (isActive && videoRef.current && !isVideoRendering) {
      const video = videoRef.current;
      
      const checkVideoRendering = () => {
        // Check if video has dimensions and is playing
        if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
          setIsVideoRendering(true);
          onStatusChange?.('Camera ready. Tap anywhere to capture and read text.');
          // Clear blank preview timeout
          if (blankPreviewTimeoutRef.current) {
            clearTimeout(blankPreviewTimeoutRef.current);
            blankPreviewTimeoutRef.current = null;
          }
        }
      };

      video.addEventListener('loadeddata', checkVideoRendering);
      video.addEventListener('playing', checkVideoRendering);
      video.addEventListener('loadedmetadata', checkVideoRendering);
      
      // Check immediately in case already loaded
      checkVideoRendering();

      // Set timeout to detect blank preview
      if (blankPreviewTimeoutRef.current) {
        clearTimeout(blankPreviewTimeoutRef.current);
      }

      blankPreviewTimeoutRef.current = setTimeout(() => {
        if (!isVideoRendering && isActive) {
          // Video is active but not rendering - attempt one restart
          if (!hasAttemptedRestartRef.current) {
            hasAttemptedRestartRef.current = true;
            onStatusChange?.('Camera preview blank. Attempting restart...');
            
            // Perform controlled restart
            retry().then((success) => {
              if (success) {
                onStatusChange?.('Camera restarted successfully');
              } else {
                // Still blank after restart - show error
                setUserFriendlyError('Camera preview is blank. Please close other apps using the camera and tap Retry.');
                onStatusChange?.('Camera Error: Preview is blank after restart.');
              }
            });
          } else {
            // Already attempted restart, show error
            setUserFriendlyError('Camera preview is blank. Please close other apps using the camera and tap Retry.');
            onStatusChange?.('Camera Error: Preview remains blank.');
          }
        }
      }, 5000); // 5 seconds to detect blank preview

      return () => {
        video.removeEventListener('loadeddata', checkVideoRendering);
        video.removeEventListener('playing', checkVideoRendering);
        video.removeEventListener('loadedmetadata', checkVideoRendering);
        if (blankPreviewTimeoutRef.current) {
          clearTimeout(blankPreviewTimeoutRef.current);
        }
      };
    }
  }, [isActive, videoRef, isVideoRendering, retry, onStatusChange]);

  // Handle page visibility changes (resume when returning to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasAttemptedStartRef.current && !isActive && !error && !isStartingRef.current) {
        onStatusChange?.('Resuming camera...');
        attemptStart();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, error, attemptStart, onStatusChange]);

  // Update user-friendly error when camera error changes
  useEffect(() => {
    if (error) {
      const friendlyMessage = getUserFriendlyErrorMessage(error);
      setUserFriendlyError(friendlyMessage);
      onStatusChange?.(friendlyMessage);
      isStartingRef.current = false;
      // Clear watchdog on error
      if (startupTimeoutRef.current) {
        clearTimeout(startupTimeoutRef.current);
        startupTimeoutRef.current = null;
      }
      if (blankPreviewTimeoutRef.current) {
        clearTimeout(blankPreviewTimeoutRef.current);
        blankPreviewTimeoutRef.current = null;
      }
    }
  }, [error, getUserFriendlyErrorMessage, onStatusChange]);

  const handleTapToCapture = async () => {
    if (!isActive || isProcessing || !isVideoRendering) return;

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
  if (isSupported === false || (userFriendlyError && userFriendlyError.includes('not supported'))) {
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

  // HTTPS required (terminal error, no retry)
  if (userFriendlyError && userFriendlyError.includes('HTTPS')) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-8 text-center">
        <div className="max-w-md">
          <h1 className="mb-4 text-2xl font-bold text-destructive">Secure Connection Required</h1>
          <p className="text-lg text-foreground" role="alert" aria-live="assertive">
            {userFriendlyError}
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

  // Show fallback CTA if camera hasn't started after timeout or silent failure
  if (showFallback || (hasAttemptedStartRef.current && !isActive && !error && !isLoading && !isStartingRef.current && hasShownFallbackRef.current)) {
    return <CameraStartupFallback onStartCamera={handleFallbackStart} isLoading={isLoading} />;
  }

  // Loading state - show appropriate message based on permission state
  if (isLoading || !isActive || isStartingRef.current) {
    let loadingMessage = 'Starting Camera...';
    let subMessage = 'Please wait';

    if (permissionState === 'prompt' || permissionState === 'unknown') {
      subMessage = 'Please allow camera access when prompted';
    } else if (permissionState === 'granted') {
      subMessage = 'Initializing camera...';
    }

    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 text-2xl font-medium text-foreground">{loadingMessage}</div>
          <p className="text-lg text-muted-foreground">{subMessage}</p>
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
      aria-disabled={isProcessing || !isVideoRendering}
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

      {/* Visual instruction overlay - only show when video is rendering */}
      {isVideoRendering && (
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-background/80 to-transparent p-6 text-center">
          <p className="text-lg font-medium text-foreground">Tap anywhere to capture and read text</p>
        </div>
      )}

      {/* Loading overlay while video initializes */}
      {!isVideoRendering && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="text-center">
            <div className="text-lg font-medium text-foreground">Initializing preview...</div>
          </div>
        </div>
      )}
    </div>
  );
}
