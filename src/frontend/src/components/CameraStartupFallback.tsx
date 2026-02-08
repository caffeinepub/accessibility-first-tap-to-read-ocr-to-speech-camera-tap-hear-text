import { Button } from './ui/button';
import { Camera } from 'lucide-react';

interface CameraStartupFallbackProps {
  onStartCamera: () => void;
  isLoading?: boolean;
}

export default function CameraStartupFallback({ onStartCamera, isLoading }: CameraStartupFallbackProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onStartCamera();
    }
  };

  return (
    <div 
      className="flex h-full w-full items-center justify-center bg-background"
      role="dialog"
      aria-label="Camera startup required"
    >
      <div className="flex flex-col items-center gap-6 p-8 text-center">
        <div className="rounded-full bg-primary/10 p-8">
          <Camera className="h-16 w-16 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">Camera Startup</h2>
          <p className="text-lg text-muted-foreground">
            The camera didn't start automatically. Tap below to start it manually.
          </p>
        </div>
        <Button
          onClick={onStartCamera}
          onKeyDown={handleKeyDown}
          size="lg"
          disabled={isLoading}
          className="min-h-[60px] min-w-[240px] text-lg font-semibold"
          aria-label="Start camera manually"
        >
          {isLoading ? 'Starting...' : 'Start Camera'}
        </Button>
      </div>
    </div>
  );
}
