import { Button } from './ui/button';
import { Pause, Play, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';

interface PlaybackControlsProps {
  onPauseResume: () => void;
  onRepeat: () => void;
  onIncreaseRate: () => void;
  onDecreaseRate: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  hasText: boolean;
}

export default function PlaybackControls({
  onPauseResume,
  onRepeat,
  onIncreaseRate,
  onDecreaseRate,
  isSpeaking,
  isPaused,
  hasText,
}: PlaybackControlsProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-3"
      role="group"
      aria-label="Playback controls"
    >
      <Button
        onClick={onPauseResume}
        disabled={!isSpeaking && !isPaused}
        size="lg"
        variant="default"
        className="min-h-[60px] min-w-[140px] text-lg"
        aria-label={isPaused ? 'Resume reading' : 'Pause reading'}
      >
        {isPaused ? (
          <>
            <Play className="mr-2 h-6 w-6" aria-hidden="true" />
            Resume
          </>
        ) : (
          <>
            <Pause className="mr-2 h-6 w-6" aria-hidden="true" />
            Pause
          </>
        )}
      </Button>

      <Button
        onClick={onRepeat}
        disabled={!hasText}
        size="lg"
        variant="secondary"
        className="min-h-[60px] min-w-[140px] text-lg"
        aria-label="Repeat last recognized text"
      >
        <RotateCcw className="mr-2 h-6 w-6" aria-hidden="true" />
        Repeat
      </Button>

      <Button
        onClick={onIncreaseRate}
        size="lg"
        variant="secondary"
        className="min-h-[60px] min-w-[140px] text-lg"
        aria-label="Increase reading speed"
      >
        <ChevronUp className="mr-2 h-6 w-6" aria-hidden="true" />
        Speed Up
      </Button>

      <Button
        onClick={onDecreaseRate}
        size="lg"
        variant="secondary"
        className="min-h-[60px] min-w-[140px] text-lg"
        aria-label="Decrease reading speed"
      >
        <ChevronDown className="mr-2 h-6 w-6" aria-hidden="true" />
        Slow Down
      </Button>
    </div>
  );
}
