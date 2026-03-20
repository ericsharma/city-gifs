import { useState, useEffect, useRef } from 'react';
import { useCameraPolling } from '../hooks/useCameraPolling';
import type { Camera } from '../types/Camera';
import { Button } from './ui/button';
import {
  Square,
  ArrowLeft,
  Settings,
  Timer,
  Camera as CameraIcon,
  Grid3X3,
  ChevronDown,
  Maximize2,
  Minimize2,
  EyeOff,
  Eye,
} from 'lucide-react';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { COLORS, GLASS_STYLE, CAMERA_FILTER } from '../constants/theme';
import { applyProcessedFilter } from '../utils/imageUtils';

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
  const [viewMode, setViewMode] = useState<'normal' | 'immersive'>('normal');
  const lastTimestampRef = useRef<number>(0);
  const lastTapRef = useRef<number>(0);

  const { data: cameraImage, isLoading, error } = useCameraPolling({
    cameraId: camera.id,
    imageUrl: camera.imageUrl,
    pollingInterval: pollingInterval * 1000,
    enabled: isPollingEnabled
  });

  // When a new frame arrives, pass raw or processed blob to parent
  useEffect(() => {
    if (!cameraImage?.blob || !onImageUpdate || cameraImage.timestamp === lastTimestampRef.current) return;
    lastTimestampRef.current = cameraImage.timestamp;

    if (viewMode === 'immersive') {
      applyProcessedFilter(cameraImage.blob)
        .then(onImageUpdate)
        .catch(() => onImageUpdate(cameraImage.blob)); // fallback to raw on error
    } else {
      onImageUpdate(cameraImage.blob);
    }
  }, [cameraImage, onImageUpdate, viewMode]);

  const handleStartCapture = () => {
    if (!isPollingEnabled) onPollingEnabledChange(true);
    onStartCapture();
  };

  const toggleViewMode = () => setViewMode(v => v === 'normal' ? 'immersive' : 'normal');

  // Double-tap the image to toggle immersive mode
  const handleImageTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      toggleViewMode();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const isImmersive = viewMode === 'immersive';

  return (
    <div className="h-full flex flex-col relative overflow-hidden" style={{ background: COLORS.bgDeepest }}>
      {/* Full-screen camera preview */}
      <div className="flex-1 relative">
        {isLoading && !cameraImage ? (
          /* Loading state — scan-line HUD */
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: COLORS.bgDeepest }}>
            <div className="text-center">
              <div
                className="relative mx-auto mb-6 overflow-hidden"
                style={{ width: 160, height: 100, border: `1px solid ${COLORS.bgSubtle}`, background: COLORS.bgDeepest }}
              >
                <div
                  className="absolute left-0 right-0 animate-scan-line"
                  style={{
                    height: '30%',
                    background: 'linear-gradient(to bottom, transparent, rgba(212,149,43,0.25), transparent)',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-xs tracking-widest" style={{ color: COLORS.bgSubtle }}>■ ■ ■</span>
                </div>
              </div>
              <p className="font-mono text-xs tracking-widest" style={{ color: COLORS.amber }}>
                ACQUIRING SIGNAL...
              </p>
            </div>
          </div>
        ) : error ? (
          /* Error state — NO SIGNAL HUD */
          <div
            className="absolute inset-0 flex items-center justify-center text-center p-8"
            style={{ background: COLORS.bgDeepest }}
          >
            <div>
              <div className="font-mono text-xs tracking-widest mb-3" style={{ color: COLORS.border }}>
                [ NO SIGNAL ]
              </div>
              <div className="font-mono text-xs mb-8 leading-relaxed" style={{ color: COLORS.textDim }}>
                CAMERA FEED UNAVAILABLE
                <br />
                <span style={{ color: COLORS.border }}>CHECK CONNECTION AND RETRY</span>
              </div>
              <button
                onClick={onBackToCamera}
                className="px-4 py-2 rounded text-sm transition-colors font-mono text-xs tracking-wide"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.textSubtle,
                  cursor: 'pointer',
                }}
              >
                ← CHOOSE DIFFERENT CAMERA
              </button>
            </div>
          </div>
        ) : cameraImage ? (
          <div className="absolute inset-0" style={{ background: COLORS.bgDeepest }}>
            {/* Blurred ambient background — always present */}
            <img
              src={cameraImage.url}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
              style={{ filter: CAMERA_FILTER, opacity: 0.7, transform: 'scale(1.05)' }}
            />
            {/* Dark scrim for HUD readability */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(13,12,10,0.15)' }} />

            {/* Sharp image — full center in normal mode, PIP in immersive */}
            <img
              src={cameraImage.url}
              alt={`${camera.name} live feed`}
              onClick={handleImageTap}
              onLoad={() => {
                if (cameraImage.url.startsWith('blob:')) {
                  setTimeout(() => URL.revokeObjectURL(cameraImage.url), 5000);
                }
              }}
              style={isImmersive ? {
                position: 'absolute',
                bottom: 90,
                right: 16,
                width: 96,
                height: 72,
                objectFit: 'cover',
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.25)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
                zIndex: 20,
                cursor: 'pointer',
                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              } : {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                zIndex: 10,
                cursor: 'pointer',
                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />

            {/* Recording indicator */}
            {isCapturing && (
              <div
                className="absolute top-16 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-sm font-mono text-xs"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  backdropFilter: 'blur(8px)',
                  color: COLORS.red,
                }}
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: COLORS.red }} />
                <span>REC</span>
                {isImmersive && <span style={{ color: COLORS.amber }}>DREAMY</span>}
                <span style={{ color: COLORS.textSubtle }}>{frameCount}/{maxFrames}</span>
              </div>
            )}

            {/* Timestamp */}
            <div
              className="absolute bottom-20 left-4 font-mono text-xs px-2 py-1 rounded-sm z-20"
              style={{
                background: 'rgba(13,12,10,0.7)',
                color: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {new Date(cameraImage.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: COLORS.bgDeepest }}>
            <p className="font-mono text-xs tracking-widest" style={{ color: COLORS.amber }}>
              INITIALIZING...
            </p>
          </div>
        )}
      </div>

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top bar — frosted glass */}
        <div
          className={`absolute top-0 left-0 right-0 px-4 py-3 ${showControls ? 'pointer-events-auto' : 'pointer-events-none'}`}
          style={{ ...GLASS_STYLE, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToCamera}
              className="text-white/70 hover:text-white hover:bg-white/10 -ml-2 h-9"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Cameras
            </Button>

            <div className="flex items-center gap-2">
              {/* Live/Paused badge */}
              <div
                className="font-mono text-xs px-2 py-1 rounded-sm border"
                style={
                  isPollingEnabled
                    ? { color: COLORS.amber, borderColor: 'rgba(212,149,43,0.3)', background: 'rgba(212,149,43,0.1)' }
                    : { color: COLORS.textDim, borderColor: COLORS.border, background: 'transparent' }
                }
              >
                {isPollingEnabled ? '● LIVE' : '○ PAUSED'}
              </div>

              {/* Immersive mode toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleViewMode}
                className="h-9 w-9 p-0 transition-colors"
                style={{ color: isImmersive ? COLORS.amber : 'rgba(255,255,255,0.7)' }}
                title={isImmersive ? 'Exit immersive mode' : 'Enter immersive mode'}
              >
                {isImmersive ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>

              {/* Hide HUD */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowControls(false)}
                className="text-white/70 hover:text-white hover:bg-white/10 h-9 w-9 p-0"
                title="Hide controls"
              >
                <EyeOff className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white/70 hover:text-white hover:bg-white/10 h-9 w-9 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Camera HUD info */}
          <div className="mt-1.5">
            <h2
              className="text-white font-semibold text-sm sm:text-base truncate"
              style={{ fontFamily: "'Satoshi', 'DM Sans', system-ui, sans-serif" }}
            >
              {camera.name}
            </h2>
            <p className="font-mono text-xs mt-0.5 tracking-wide" style={{ color: COLORS.textDim }}>
              {camera.area}
              {isImmersive && <span style={{ color: COLORS.amber }}> · DREAMY MODE</span>}
            </p>
          </div>
        </div>

        {/* Bottom controls — frosted glass */}
        <div
          className={`absolute bottom-0 left-0 right-0 px-4 py-4 ${showControls ? 'pointer-events-auto' : 'pointer-events-none'}`}
          style={{ ...GLASS_STYLE, borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-center gap-6 mb-4">
            {/* View frames */}
            {frameCount > 0 && (
              <button
                onClick={onViewFrames}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(12px)',
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                }}
              >
                <Grid3X3 className="h-4 w-4" />
                <span>{frameCount}</span>
              </button>
            )}

            {/* Record button — 56px circle */}
            <button
              onClick={isCapturing ? onStopCapture : handleStartCapture}
              disabled={!isPollingEnabled && !isCapturing}
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: COLORS.red,
                border: '3px solid rgba(255,255,255,0.25)',
                boxShadow: isCapturing
                  ? '0 0 24px rgba(239,68,68,0.5)'
                  : '0 0 20px rgba(239,68,68,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 80ms ease',
                opacity: !isPollingEnabled && !isCapturing ? 0.4 : 1,
                flexShrink: 0,
              }}
            >
              {isCapturing ? (
                <Square className="h-5 w-5 text-white" fill="white" />
              ) : (
                <div className="rounded-full bg-white" style={{ width: 18, height: 18 }} />
              )}
            </button>

            {/* Create GIF */}
            {frameCount >= 2 && (
              <button
                onClick={onViewFrames}
                className="flex items-center px-4 py-2 rounded-lg transition-all"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(12px)',
                  color: COLORS.amber,
                  cursor: 'pointer',
                }}
              >
                <span className="font-mono text-xs tracking-wide">GIF →</span>
              </button>
            )}
          </div>

          {/* Capture progress — amber bar */}
          {isCapturing && (
            <div>
              <div className="flex justify-between font-mono text-xs mb-2">
                <span style={{ color: COLORS.red }}>● REC{isImmersive ? ' · DREAMY' : ''}</span>
                <span style={{ color: COLORS.textDim }}>
                  {frameCount} / {maxFrames}
                </span>
              </div>
              <div
                className="w-full rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.1)', height: 3 }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${(frameCount / maxFrames) * 100}%`, background: COLORS.amber }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Restore pill — visible only when controls are hidden */}
      {!showControls && (
        <button
          onClick={() => setShowControls(true)}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full transition-opacity"
          style={{
            background: 'rgba(13,12,10,0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          <Eye className="h-3.5 w-3.5" />
          <span className="font-mono text-xs tracking-wide">SHOW HUD</span>
        </button>
      )}

      {/* Settings panel — always dark, never bg-background */}
      {showSettings && (
        <div
          className="absolute inset-0 pointer-events-auto flex items-end"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}
        >
          <div
            className="w-full max-h-[70vh] rounded-t-2xl p-6 space-y-6 scrollable"
            style={{ background: COLORS.bgPanel, borderTop: `1px solid ${COLORS.border}` }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="font-semibold"
                style={{ color: COLORS.textLight, fontFamily: "'Satoshi', 'DM Sans', system-ui" }}
              >
                Camera Settings
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(false)}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Live feed */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2" style={{ color: COLORS.textSubtle }}>
                <Timer className="h-4 w-4" />
                Live Feed
              </h4>
              <div className="flex items-center justify-between">
                <label className="text-sm" style={{ color: COLORS.textLabel }}>
                  Enable live updates
                </label>
                <Switch checked={isPollingEnabled} onCheckedChange={onPollingEnabledChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm" style={{ color: COLORS.textLabel }}>
                  Update interval (seconds)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={pollingInterval}
                  onChange={(e) => onPollingIntervalChange(Number(e.target.value))}
                  disabled={!isPollingEnabled}
                  className="border-[#4A453B] text-white"
                  style={{ background: COLORS.bgSubtle }}
                />
              </div>
            </div>

            {/* Recording */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2" style={{ color: COLORS.textSubtle }}>
                <CameraIcon className="h-4 w-4" />
                Recording
              </h4>
              <div className="space-y-2">
                <label className="text-sm" style={{ color: COLORS.textLabel }}>
                  Maximum frames
                </label>
                <Input
                  type="number"
                  min={5}
                  max={200}
                  value={maxFrames}
                  onChange={(e) => onMaxFramesChange(Number(e.target.value))}
                  className="border-[#4A453B] text-white"
                  style={{ background: COLORS.bgSubtle }}
                />
              </div>
            </div>

            <div className="pt-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
              <Button
                variant="outline"
                onClick={() => setShowSettings(false)}
                className="w-full border-[#4A453B] text-[#A09A8F] hover:text-white hover:border-[#6B665C]"
                style={{ background: 'transparent' }}
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
