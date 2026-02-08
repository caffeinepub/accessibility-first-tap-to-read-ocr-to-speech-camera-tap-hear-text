import { useState, useEffect, useCallback } from 'react';
import CameraPreview from '../components/CameraPreview';
import PlaybackControls from '../components/PlaybackControls';
import LiveAnnouncer from '../components/LiveAnnouncer';
import OrientationPrompt from '../components/OrientationPrompt';
import AudioStateCue from '../components/AudioStateCue';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useOnDeviceOcr } from '../hooks/useOnDeviceOcr';
import { useCaptureHaptics } from '../hooks/useCaptureHaptics';
import { useOrientation } from '../hooks/useOrientation';

export default function CameraReaderScreen() {
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const [lastRecognizedText, setLastRecognizedText] = useState<string>('');
  const { isPortrait } = useOrientation();
  const { vibrate } = useCaptureHaptics();
  const { recognizeText, isProcessing, error: ocrError } = useOnDeviceOcr();
  const { speak, pause, resume, cancel, isSpeaking, isPaused, rate, setRate } = useTextToSpeech();
  const [announcement, setAnnouncement] = useState<string>('');
  const [audioState, setAudioState] = useState<string>('');

  const handleCapture = useCallback(
    async (imageFile: File) => {
      setCapturedImage(imageFile);

      // Haptic feedback
      const didVibrate = vibrate();
      if (!didVibrate) {
        setAnnouncement('Image captured');
      }

      // Announce processing started
      setAudioState('processing');
      setAnnouncement('Processing image');

      try {
        const text = await recognizeText(imageFile);

        if (text && text.trim().length > 0) {
          setLastRecognizedText(text);
          setAudioState('success');
          setAnnouncement('Text recognized. Reading now.');
          // Automatically speak the recognized text
          speak(text);
        } else {
          setAudioState('empty');
          setAnnouncement('No text found in image');
          speak('No text found in image');
        }
      } catch (err) {
        setAudioState('error');
        setAnnouncement('Error processing image');
        speak('Error processing image');
      }
    },
    [recognizeText, vibrate, speak]
  );

  const handleRepeat = useCallback(() => {
    if (lastRecognizedText) {
      cancel();
      speak(lastRecognizedText);
    }
  }, [lastRecognizedText, cancel, speak]);

  const handlePauseResume = useCallback(() => {
    if (isSpeaking && !isPaused) {
      pause();
    } else if (isPaused) {
      resume();
    }
  }, [isSpeaking, isPaused, pause, resume]);

  const handleIncreaseRate = useCallback(() => {
    const newRate = Math.min(rate + 0.25, 2.0);
    setRate(newRate);
    setAnnouncement(`Speed increased to ${newRate.toFixed(2)}`);
  }, [rate, setRate]);

  const handleDecreaseRate = useCallback(() => {
    const newRate = Math.max(rate - 0.25, 0.5);
    setRate(newRate);
    setAnnouncement(`Speed decreased to ${newRate.toFixed(2)}`);
  }, [rate, setRate]);

  const handleCameraStatusChange = useCallback((status: string) => {
    setAnnouncement(status);
  }, []);

  if (!isPortrait) {
    return <OrientationPrompt />;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <LiveAnnouncer message={announcement} politeness="assertive" />
      <AudioStateCue state={audioState} />

      {/* Main instruction - visible for screen readers */}
      <div className="sr-only" role="status" aria-live="polite">
        Tap anywhere on the screen to capture and read text from the camera view
      </div>

      {/* Camera preview fills the screen */}
      <div className="absolute inset-0">
        <CameraPreview 
          onCapture={handleCapture} 
          isProcessing={isProcessing}
          onStatusChange={handleCameraStatusChange}
        />
      </div>

      {/* Playback controls - visually hidden but accessible */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <PlaybackControls
          onPauseResume={handlePauseResume}
          onRepeat={handleRepeat}
          onIncreaseRate={handleIncreaseRate}
          onDecreaseRate={handleDecreaseRate}
          isSpeaking={isSpeaking}
          isPaused={isPaused}
          hasText={!!lastRecognizedText}
        />
      </div>

      {/* Processing indicator for visual users */}
      {isProcessing && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-background/90 px-8 py-6 text-center shadow-lg"
          role="status"
          aria-live="polite"
        >
          <div className="text-lg font-medium text-foreground">Processing...</div>
        </div>
      )}
    </div>
  );
}
