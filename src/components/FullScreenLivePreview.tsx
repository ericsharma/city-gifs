import { useState, useEffect, useRef } from 'react';
import { useCameraPolling } from '../hooks/useCameraPolling';
import type { Camera } from '../types/Camera';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Play, 
  Square, 
  ArrowLeft,
  ArrowRight,
  Settings, 
  Timer,
  Camera as CameraIcon, 
  Wifi, 
  WifiOff,
  Grid3X3,
  ChevronDown
} from 'lucide-react';
import { Switch } from './ui/switch';
import { Input } from './ui/input';

interface FullScreenLivePreviewProps {
  camera: Camera;
  pollingInterval: number;
  onPollingIntervalChange: (interval: number) => void;
  isPollingEnabled: boolean;
  onPollingEnabledChange: (enabled: boolean) => void;
  isCapturing: boolean;
  onStartCapture: () => void;
  onStopCapture: () => void;
  frameCount: number;
  maxFrames: number;
  onMaxFramesChange: (frames: number) => void;
  onImageUpdate?: (blob: Blob) => void;
  onBackToCamera: () => void;
  onViewFrames: () => void;
}

export function FullScreenLivePreview({
  camera,
  pollingInterval,
  onPollingIntervalChange,
  isPollingEnabled,
  onPollingEnabledChange,
  isCapturing,
  onStartCapture,
  onStopCapture,
  frameCount,
  maxFrames,
  onMaxFramesChange,
  onImageUpdate,
  onBackToCamera,
  onViewFrames
}: FullScreenLivePreviewProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  
  const { data: cameraImage, isLoading, error } = useCameraPolling({
    cameraId: camera.id,
    imageUrl: camera.imageUrl,
    pollingInterval: pollingInterval * 1000,
    enabled: isPollingEnabled
  });

  // Call onImageUpdate only when we get a genuinely new image
  useEffect(() => {
    if (cameraImage?.blob && onImageUpdate && cameraImage.timestamp !== lastTimestampRef.current) {
      lastTimestampRef.current = cameraImage.timestamp;
      onImageUpdate(cameraImage.blob);
    }
  }, [cameraImage, onImageUpdate]);

  // Auto-hide controls after inactivity (except when capturing or settings open)
  useEffect(() => {
    if (showSettings || isCapturing) return;

    const resetTimeout = () => {
      setControlsTimeout(prev => {
        if (prev) clearTimeout(prev);
        return setTimeout(() => setShowControls(false), 4000);
      });
      setShowControls(true);
    };

    const handleInteraction = () => resetTimeout();
    
    resetTimeout();
    
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('click', handleInteraction);
    
    return () => {
      setControlsTimeout(prev => {
        if (prev) clearTimeout(prev);
        return null;
      });
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [showSettings, isCapturing]);

  const handleStartCapture = () => {
    if (!isPollingEnabled) {
      onPollingEnabledChange(true);
    }
    onStartCapture();
  };

  return (
    <div className="h-full bg-black flex flex-col relative overflow-hidden">
      {/* Full-screen camera preview */}
      <div className="flex-1 relative">
        {isLoading && !cameraImage ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">Connecting to camera...</p>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black text-center p-8">
            <div className="text-white">
              <CameraIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Connection Failed</h3>
              <p className="text-sm opacity-75 mb-6">
                Unable to connect to camera feed. Check your connection and try again.
              </p>
              <Button variant="outline" onClick={onBackToCamera}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Choose Different Camera
              </Button>
            </div>
          </div>
        ) : cameraImage ? (
          <div className="absolute inset-0">
            <img
              src={cameraImage.url}
              alt={`${camera.name} live feed`}
              className="w-full h-full object-cover"
              onLoad={() => {
                if (cameraImage.url.startsWith('blob:')) {
                  setTimeout(() => URL.revokeObjectURL(cameraImage.url), 5000);
                }
              }}
            />
            
            {/* Recording indicator */}
            {isCapturing && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-2 rounded-full flex items-center gap-2 z-20">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="font-medium">REC</span>
                <span className="text-sm">{frameCount}/{maxFrames}</span>
              </div>
            )}

            {/* Timestamp */}
            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-sm px-3 py-1 rounded">
              {new Date(cameraImage.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white">
              <CameraIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Starting camera feed...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls overlay */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 pointer-events-auto">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onBackToCamera}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cameras
            </Button>

            <div className="flex items-center gap-2">
              <Badge variant={isPollingEnabled ? "default" : "secondary"} className="bg-white/20 text-white border-white/30">
                {isPollingEnabled ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Live
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Paused
                  </>
                )}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:bg-white/20"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Camera info */}
          <div className="mt-2 text-white">
            <h2 className="font-medium text-sm sm:text-base truncate">{camera.name}</h2>
            <p className="text-xs opacity-75">{camera.area}</p>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-auto">
          {/* Main capture controls */}
          <div className="flex items-center justify-center gap-4 mb-4">
            {frameCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewFrames}
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                View Frames ({frameCount})
              </Button>
            )}

            <div className="flex-1 max-w-xs">
              {!isCapturing ? (
                <Button 
                  onClick={handleStartCapture}
                  disabled={!isPollingEnabled}
                  size="lg"
                  className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-medium"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button 
                  onClick={onStopCapture}
                  size="lg"
                  variant="destructive"
                  className="w-full h-12 font-medium"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop Recording
                </Button>
              )}
            </div>

            {frameCount >= 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewFrames}
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                Create GIF
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Progress indicator when capturing */}
          {isCapturing && (
            <div className="text-center text-white">
              <div className="flex justify-between text-sm mb-2">
                <span>Recording frames...</span>
                <span>{frameCount}/{maxFrames}</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(frameCount / maxFrames) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/90 pointer-events-auto flex items-end">
          <div className="bg-background w-full max-h-[70vh] rounded-t-3xl p-6 space-y-6 scrollable">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Camera Settings</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSettings(false)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Live feed settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Live Feed
              </h4>
              
              <div className="flex items-center justify-between">
                <label className="text-sm">Enable live updates</label>
                <Switch
                  checked={isPollingEnabled}
                  onCheckedChange={onPollingEnabledChange}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm">Update interval (seconds)</label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={pollingInterval}
                  onChange={(e) => onPollingIntervalChange(Number(e.target.value))}
                  disabled={!isPollingEnabled}
                />
              </div>
            </div>

            {/* Recording settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <CameraIcon className="h-4 w-4" />
                Recording
              </h4>
              
              <div className="space-y-2">
                <label className="text-sm">Maximum frames</label>
                <Input
                  type="number"
                  min={5}
                  max={200}
                  value={maxFrames}
                  onChange={(e) => onMaxFramesChange(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowSettings(false)}
                className="w-full"
              >
                Close Settings
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}