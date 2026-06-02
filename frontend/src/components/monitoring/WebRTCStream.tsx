import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  VideoCameraIcon,
  VideoCameraSlashIcon,
  SignalIcon,
  SignalSlashIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { webrtcService, StreamInfo } from '../../services/webrtc.service';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';

interface WebRTCStreamProps {
  // Student props
  attemptId?: string;
  examId?: string;
  autoStart?: boolean;

  // Proctor props
  mode?: 'send' | 'receive';
  targetStudentId?: string;

  // Common props
  className?: string;
  showControls?: boolean;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;
}

interface RemoteStream {
  peerId: string;
  stream: MediaStream;
  studentId?: string;
  studentName?: string;
  attemptId?: string;
}

const WebRTCStream: React.FC<WebRTCStreamProps> = ({
  attemptId,
  examId,
  autoStart = true,
  mode = 'send',
  targetStudentId,
  className = '',
  showControls = true,
  onConnectionChange,
  onError,
}) => {
  const { t } = useTranslation();
  const { user, token } = useAuth();

  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize WebRTC service
  useEffect(() => {
    if (!token) return;

    webrtcService.setToken(token);

    const role = mode === 'send' ? 'student' : 'proctor';
    const roomId = examId || attemptId;

    webrtcService.onConnectionStateChange((state) => {
      const connected = state === 'connected';
      setIsConnected(connected);
      onConnectionChange?.(connected);
    });

    webrtcService.onStream((info: StreamInfo) => {
      setRemoteStreams(prev => {
        const existing = prev.find(s => s.peerId === info.peerId);
        if (existing) {
          return prev.map(s => s.peerId === info.peerId ? { ...s, stream: info.stream } : s);
        }
        return [...prev, {
          peerId: info.peerId,
          stream: info.stream,
          studentId: info.studentId,
          studentName: info.studentName,
          attemptId: info.attemptId,
        }];
      });
    });

    webrtcService.onStreamEnd((peerId) => {
      setRemoteStreams(prev => prev.filter(s => s.peerId !== peerId));
      if (selectedStream === peerId) {
        setSelectedStream(null);
      }
    });

    webrtcService.onError((err) => {
      console.error('WebRTC error:', err);
      setError(err.message);
      onError?.(err);
    });

    // Connect to signaling server
    webrtcService.connect(role, roomId).catch((err) => {
      setError(err.message);
      onError?.(err);
    });

    return () => {
      webrtcService.disconnect();
    };
  }, [token, mode, examId, attemptId, onConnectionChange, onError]);

  // Auto-start streaming for students
  useEffect(() => {
    if (autoStart && mode === 'send' && isConnected && !isStreaming) {
      startStreaming();
    }
  }, [autoStart, mode, isConnected, isStreaming]);

  // Set local video source
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Start streaming (student mode)
  const startStreaming = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      setLocalStream(stream);
      setIsStreaming(true);

      await webrtcService.startStreaming(stream);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start streaming';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [onError]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    webrtcService.stopStreaming();
    setIsStreaming(false);
  }, [localStream]);

  // Request stream from student (proctor mode)
  const requestStudentStream = useCallback((studentId: string, attemptId: string) => {
    webrtcService.requestStream(studentId, attemptId);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Render student streaming view
  if (mode === 'send') {
    return (
      <div ref={containerRef} className={`bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        {/* Header */}
        <div className="px-4 py-2 bg-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <VideoCameraIcon className="h-5 w-5" />
            <span className="text-sm font-medium">
              {t('webrtc.liveStream') || 'Live Stream'}
            </span>
            {isConnected ? (
              <span className="flex items-center gap-1 text-green-400 text-xs">
                <SignalIcon className="h-4 w-4" />
                {t('webrtc.connected') || 'Connected'}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-400 text-xs">
                <SignalSlashIcon className="h-4 w-4" />
                {t('webrtc.disconnected') || 'Disconnected'}
              </span>
            )}
          </div>
          {showControls && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowsPointingOutIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Video */}
        <div className="relative aspect-video bg-black">
          {isStreaming ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <VideoCameraSlashIcon className="h-16 w-16 mb-4" />
              <p className="text-sm">{t('webrtc.streamNotStarted') || 'Stream not started'}</p>
            </div>
          )}

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {t('webrtc.live') || 'LIVE'}
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
              <div className="text-center text-white p-4">
                <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-2 text-red-500" />
                <p className="text-sm">{error}</p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={startStreaming}
                >
                  {t('common.retry') || 'Retry'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {showControls && (
          <div className="px-4 py-3 bg-gray-800 flex items-center justify-center gap-4">
            {isStreaming ? (
              <Button
                variant="danger"
                size="sm"
                onClick={stopStreaming}
              >
                <VideoCameraSlashIcon className="h-4 w-4 mr-2" />
                {t('webrtc.stopStream') || 'Stop Stream'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={startStreaming}
                disabled={!isConnected}
              >
                <VideoCameraIcon className="h-4 w-4 mr-2" />
                {t('webrtc.startStream') || 'Start Stream'}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Render proctor receiving view
  return (
    <div ref={containerRef} className={`bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-2 bg-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <VideoCameraIcon className="h-5 w-5" />
          <span className="text-sm font-medium">
            {t('webrtc.studentStreams') || 'Student Streams'}
          </span>
          <span className="text-xs text-gray-400">
            ({remoteStreams.length} {t('webrtc.active') || 'active'})
          </span>
        </div>
        {showControls && (
          <button
            onClick={toggleFullscreen}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowsPointingOutIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Streams grid */}
      {remoteStreams.length > 0 ? (
        <div className={`grid gap-2 p-2 ${
          remoteStreams.length === 1 ? 'grid-cols-1' :
          remoteStreams.length <= 4 ? 'grid-cols-2' :
          remoteStreams.length <= 9 ? 'grid-cols-3' :
          'grid-cols-4'
        }`}>
          {remoteStreams.map((stream) => (
            <StreamTile
              key={stream.peerId}
              stream={stream}
              isSelected={selectedStream === stream.peerId}
              onSelect={() => setSelectedStream(stream.peerId === selectedStream ? null : stream.peerId)}
              onClose={() => webrtcService.stopReceivingStream(stream.peerId)}
            />
          ))}
        </div>
      ) : (
        <div className="aspect-video flex flex-col items-center justify-center text-gray-400">
          <VideoCameraSlashIcon className="h-16 w-16 mb-4" />
          <p className="text-sm">{t('webrtc.noStreams') || 'No active streams'}</p>
          <p className="text-xs mt-2">{t('webrtc.waitingForStudents') || 'Waiting for students to connect...'}</p>
        </div>
      )}

      {/* Selected stream fullscreen modal */}
      {selectedStream && (
        <FullscreenStreamModal
          stream={remoteStreams.find(s => s.peerId === selectedStream)}
          onClose={() => setSelectedStream(null)}
        />
      )}

      {/* Connection status */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
            {isConnected ? (
              <span className="flex items-center gap-1">
                <SignalIcon className="h-4 w-4" />
                {t('webrtc.signalConnected') || 'Signal connected'}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <SignalSlashIcon className="h-4 w-4" />
                {t('webrtc.signalDisconnected') || 'Signal disconnected'}
              </span>
            )}
          </span>
          <span className="text-gray-400">
            {webrtcService.getPeerCount()} {t('webrtc.peers') || 'peers'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Stream tile component for grid view
interface StreamTileProps {
  stream: RemoteStream;
  isSelected: boolean;
  onSelect: () => void;
  onClose: () => void;
}

const StreamTile: React.FC<StreamTileProps> = ({ stream, isSelected, onSelect, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream.stream) {
      videoRef.current.srcObject = stream.stream;
    }
  }, [stream.stream]);

  return (
    <div
      className={`relative aspect-video bg-black rounded overflow-hidden cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-primary-500' : 'hover:ring-1 hover:ring-gray-600'
      }`}
      onClick={onSelect}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Student info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
        <p className="text-white text-xs font-medium truncate">
          {stream.studentName || stream.studentId || 'Unknown'}
        </p>
      </div>

      {/* Live indicator */}
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded text-xs">
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        LIVE
      </div>

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded hover:bg-opacity-75 text-white"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

// Fullscreen stream modal
interface FullscreenStreamModalProps {
  stream?: RemoteStream;
  onClose: () => void;
}

const FullscreenStreamModal: React.FC<FullscreenStreamModalProps> = ({ stream, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream?.stream) {
      videoRef.current.srcObject = stream.stream;
    }
  }, [stream?.stream]);

  if (!stream) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="max-w-full max-h-full object-contain"
      />

      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <p className="font-medium">{stream.studentName || 'Student'}</p>
            <p className="text-sm text-gray-300">{stream.studentId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 text-white"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Live indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        LIVE
      </div>
    </div>
  );
};

export default WebRTCStream;
