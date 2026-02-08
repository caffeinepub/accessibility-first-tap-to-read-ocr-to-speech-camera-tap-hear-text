import { useEffect } from 'react';

interface AudioStateCueProps {
  state: string;
}

const STATE_MESSAGES: Record<string, string> = {
  processing: 'Processing image',
  success: 'Text recognized',
  empty: 'No text found',
  error: 'Error occurred',
};

export default function AudioStateCue({ state }: AudioStateCueProps) {
  useEffect(() => {
    if (state && STATE_MESSAGES[state]) {
      // The message will be announced via LiveAnnouncer in the parent
    }
  }, [state]);

  return null;
}
