import { useState, useCallback, useRef, useEffect } from 'react';

interface UseCameraOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  autoStart?: boolean;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  stream: MediaStream | null;
  isLoading: boolean;
  error: string | null;
  isActive: boolean;
  hasPermission: boolean | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  takePhoto: () => string | null;
  switchCamera: () => Promise<void>;
}

/**
 * Custom hook for camera access and photo capture
 * Used for face verification during exams
 */
export const useCamera = (options: UseCameraOptions = {}): UseCameraReturn => {
  const {
    width = 640,
    height = 480,
    facingMode = 'user',
    autoStart = false,
  } = options;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState(facingMode);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: currentFacingMode,
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasPermission(true);
      setIsActive(true);

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err) {
      const error = err as Error;
      let errorMessage = 'Failed to access camera';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied';
        setHasPermission(false);
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not supported';
      }

      setError(errorMessage);
      setIsActive(false);
      console.error('Camera error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [width, height, currentFacingMode]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStream(null);
    setIsActive(false);
  }, []);

  // Take a photo from the video stream
  const takePhoto = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current || !isActive) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      return null;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || width;
    canvas.height = video.videoHeight || height;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64 image
    try {
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (err) {
      console.error('Failed to capture photo:', err);
      return null;
    }
  }, [isActive, width, height]);

  // Switch between front and back camera
  const switchCamera = useCallback(async () => {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    setCurrentFacingMode(newFacingMode);

    if (isActive) {
      stopCamera();
      // Wait a bit before restarting with new facing mode
      await new Promise((resolve) => setTimeout(resolve, 100));
      await startCamera();
    }
  }, [currentFacingMode, isActive, stopCamera, startCamera]);

  // Auto-start camera if option is enabled
  useEffect(() => {
    if (autoStart) {
      startCamera();
    }

    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [autoStart, startCamera, stopCamera]);

  // Handle visibility change (stop camera when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        // Optionally pause or continue - for exam verification, we might want to keep it running
        console.log('Tab hidden, camera still active');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive]);

  return {
    videoRef,
    canvasRef,
    stream,
    isLoading,
    error,
    isActive,
    hasPermission,
    startCamera,
    stopCamera,
    takePhoto,
    switchCamera,
  };
};

export default useCamera;
