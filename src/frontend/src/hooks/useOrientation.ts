import { useState, useEffect } from 'react';

interface UseOrientationReturn {
  isPortrait: boolean;
  orientation: 'portrait' | 'landscape';
}

export function useOrientation(): UseOrientationReturn {
  const [isPortrait, setIsPortrait] = useState(true);

  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
    };

    // Check on mount
    checkOrientation();

    // Listen for orientation changes
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return {
    isPortrait,
    orientation: isPortrait ? 'portrait' : 'landscape',
  };
}
