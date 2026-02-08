import { useState, useEffect } from 'react';

export type PermissionState = 'unknown' | 'prompt' | 'granted' | 'denied' | 'unavailable';

export interface UseCameraPermissionReturn {
  permissionState: PermissionState;
  checkPermission: () => Promise<void>;
}

/**
 * Hook to detect camera permission state using the Permissions API when available,
 * with safe fallbacks for browsers that don't support it.
 */
export function useCameraPermission(): UseCameraPermissionReturn {
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');

  const checkPermission = async () => {
    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionState('unavailable');
      return;
    }

    // Try to use Permissions API if available
    if ('permissions' in navigator && 'query' in navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        
        switch (result.state) {
          case 'granted':
            setPermissionState('granted');
            break;
          case 'denied':
            setPermissionState('denied');
            break;
          case 'prompt':
            setPermissionState('prompt');
            break;
          default:
            setPermissionState('unknown');
        }

        // Listen for permission changes
        result.addEventListener('change', () => {
          switch (result.state) {
            case 'granted':
              setPermissionState('granted');
              break;
            case 'denied':
              setPermissionState('denied');
              break;
            case 'prompt':
              setPermissionState('prompt');
              break;
            default:
              setPermissionState('unknown');
          }
        });
      } catch (err) {
        // Permissions API not supported or query failed
        // Fall back to unknown state
        setPermissionState('unknown');
      }
    } else {
      // Permissions API not available, state remains unknown
      setPermissionState('unknown');
    }
  };

  useEffect(() => {
    checkPermission();
  }, []);

  return { permissionState, checkPermission };
}
