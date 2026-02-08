import { useCallback } from 'react';

interface UseCaptureHapticsReturn {
  vibrate: () => boolean;
}

export function useCaptureHaptics(): UseCaptureHapticsReturn {
  const vibrate = useCallback((): boolean => {
    if ('vibrate' in navigator) {
      try {
        // Short, sharp vibration for capture confirmation
        navigator.vibrate(50);
        return true;
      } catch (err) {
        console.warn('Vibration failed:', err);
        return false;
      }
    }
    return false;
  }, []);

  return { vibrate };
}
