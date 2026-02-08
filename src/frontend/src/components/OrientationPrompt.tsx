import { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';

export default function OrientationPrompt() {
  const [announced, setAnnounced] = useState(false);

  useEffect(() => {
    if (!announced) {
      setAnnounced(true);
    }
  }, [announced]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background p-8">
      <div className="text-center">
        <RotateCw className="mx-auto mb-6 h-24 w-24 animate-pulse text-foreground" aria-hidden="true" />
        <h1 className="mb-4 text-3xl font-bold text-foreground">Please Rotate Your Device</h1>
        <p className="text-xl text-muted-foreground">
          This app works best in portrait orientation
        </p>
        <div
          role="status"
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
        >
          Please rotate your device to portrait orientation to use this app
        </div>
      </div>
    </div>
  );
}
