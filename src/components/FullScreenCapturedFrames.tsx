import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollableFrameGrid } from './ScrollableFrameGrid';
import { ArrowLeft, Timer } from 'lucide-react';
import { COLORS } from '../constants/theme';

interface CapturedFrame {
  blob: Blob;
  timestamp: number;
  url: string;
  selected?: boolean;
}

interface FullScreenCapturedFramesProps {
  frames: CapturedFrame[];
  camera: { name: string; area: string };
  onBackToPreview: () => void;
  onClearFrames: () => void;
  onCreateGIF: () => void;
  onFrameSelectionToggle: (index: number) => void;
  isCreatingGIF: boolean;
  captureProgress: number;
  gifBlob?: Blob | null;
  gifError?: string | null;
}

export function FullScreenCapturedFrames({
  frames,
  camera,
  onBackToPreview,
  onClearFrames,
  onCreateGIF,
  onFrameSelectionToggle,
  isCreatingGIF,
  captureProgress,
  gifBlob,
  gifError,
}: FullScreenCapturedFramesProps) {
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null);

  const estimatedDuration =
    frames.length > 1 ? (frames[frames.length - 1].timestamp - frames[0].timestamp) / 1000 : 0;

  if (frames.length === 0) {
    return (
      <div className="h-full flex flex-col" style={{ background: COLORS.bgDark }}>
        <div className="p-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToPreview}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Camera
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <div className="font-mono text-xs tracking-widest mb-3" style={{ color: COLORS.bgSubtle }}>
              ⊞ &nbsp; ⊞ &nbsp; ⊞
            </div>
            <div className="font-mono text-sm tracking-widest mb-2" style={{ color: COLORS.amber }}>
              CAPTURE BUFFER EMPTY
            </div>
            <div className="font-mono text-xs mb-8 tracking-wide" style={{ color: COLORS.textDim }}>
              NO FRAMES RECORDED
            </div>
            <Button
              onClick={onBackToPreview}
              className="font-medium"
              style={{ background: COLORS.amber, color: COLORS.bgDark }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Camera
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-b">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={onBackToPreview}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Camera
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">
                {frames.length} frames
              </Badge>
              {estimatedDuration > 0 && (
                <Badge variant="outline" className="text-xs font-mono">
                  <Timer className="h-3 w-3 mr-1" />
                  {estimatedDuration.toFixed(1)}s
                </Badge>
              )}
            </div>
          </div>

          <div>
            <h2
              className="font-semibold text-sm sm:text-base"
              style={{ fontFamily: "'Satoshi', 'DM Sans', system-ui, sans-serif" }}
            >
              {camera.name}
            </h2>
            <p className="font-mono text-xs text-muted-foreground mt-0.5">{camera.area}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* GIF Ready notification */}
        {gifBlob && !isCreatingGIF && (
          <div className="flex-shrink-0 p-3 border-b" style={{ background: 'rgba(212,149,43,0.08)', borderColor: 'rgba(212,149,43,0.2)' }}>
            <div className="text-center">
              <span className="font-mono text-xs tracking-widest" style={{ color: COLORS.amber }}>
                ✓ GIF READY
              </span>
            </div>
          </div>
        )}

        {/* Error notification */}
        {gifError && (
          <div className="flex-shrink-0 p-3 border-b" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
            <div className="text-center">
              <span className="font-mono text-xs tracking-widest" style={{ color: COLORS.red }}>
                ✕ {gifError}
              </span>
            </div>
          </div>
        )}

        {/* Scrollable Frames Grid */}
        <div className="flex-1 min-h-0">
          <ScrollableFrameGrid
            frames={frames}
            selectedFrame={selectedFrame}
            onFrameClick={(index) => setSelectedFrame(index === -1 ? null : index)}
            onFrameSelectionToggle={onFrameSelectionToggle}
            onCreateGIF={onCreateGIF}
            onClearFrames={onClearFrames}
            isCreatingGIF={isCreatingGIF}
            captureProgress={captureProgress}
            gifBlob={gifBlob}
            estimatedDuration={estimatedDuration}
          />
        </div>
      </div>

      {/* GIF Encoding overlay — frosted glass */}
      {isCreatingGIF && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'rgba(13,12,10,0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div
            className="text-center rounded-xl p-8 border"
            style={{ background: COLORS.bgPanel, borderColor: COLORS.border, minWidth: 240 }}
          >
            <div className="font-mono text-sm tracking-widest mb-6" style={{ color: COLORS.amber }}>
              ENCODING...
            </div>
            <div
              className="w-full rounded-full overflow-hidden mb-3"
              style={{ background: 'rgba(255,255,255,0.1)', height: 3 }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${captureProgress}%`, background: COLORS.amber }}
              />
            </div>
            <div className="font-mono text-xs" style={{ color: COLORS.textDim }}>
              {captureProgress}%
            </div>
          </div>
        </div>
      )}

      {/* Selected frame fullscreen preview */}
      {selectedFrame !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={() => setSelectedFrame(null)}
        >
          <div className="relative max-w-4xl w-full">
            <div className="overflow-hidden rounded-lg aspect-video" style={{ background: COLORS.bgDeepest }}>
              <img
                src={frames[selectedFrame].url}
                alt={`Frame ${selectedFrame + 1} preview`}
                className="w-full h-full object-contain"
              />
            </div>
            <div
              className="absolute bottom-4 left-4 font-mono text-xs px-3 py-1.5 rounded-sm"
              style={{ background: 'rgba(13,12,10,0.8)', color: COLORS.textSubtle }}
            >
              FRAME {selectedFrame + 1} / {frames.length}
            </div>
            <div
              className="absolute top-4 right-4 font-mono text-xs px-3 py-1.5 rounded-sm"
              style={{ background: 'rgba(13,12,10,0.8)', color: COLORS.textDim }}
            >
              {new Date(frames[selectedFrame].timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
