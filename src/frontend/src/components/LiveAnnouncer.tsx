import { useEffect, useRef } from 'react';

interface LiveAnnouncerProps {
  message: string;
  politeness?: 'polite' | 'assertive';
}

export default function LiveAnnouncer({ message, politeness = 'polite' }: LiveAnnouncerProps) {
  const previousMessageRef = useRef<string>('');

  useEffect(() => {
    // Only announce if message has changed and is not empty
    if (message && message !== previousMessageRef.current) {
      previousMessageRef.current = message;
    }
  }, [message]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
