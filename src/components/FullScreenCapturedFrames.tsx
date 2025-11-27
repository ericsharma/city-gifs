import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollableFrameGrid } from './ScrollableFrameGrid';
import { 
  ArrowLeft,
  Timer,
  Grid3X3
} from 'lucide-react';

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
  gifBlob
}: FullScreenCapturedFramesProps) {
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null);

  const estimatedDuration = frames.length > 1 
    ? (frames[frames.length - 1].timestamp - frames[0].timestamp) / 1000 
    : 0;

  if (frames.length === 0) {
    return (
      <div className="h-full bg-background flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBackToPreview}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Camera
            </Button>
            <div className="flex-1">
              <h2 className="font-medium text-sm">Captured Frames</h2>
              <p className="text-xs text-muted-foreground">{camera.name}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <Grid3X3 className="h-20 w-20 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No frames captured yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Go back to camera preview and start recording to capture frames
            </p>
            <Button onClick={onBackToPreview}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Camera
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-b">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={onBackToPreview}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Camera
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {frames.length} frames
              </Badge>
              {estimatedDuration > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Timer className="h-3 w-3 mr-1" />
                  {estimatedDuration.toFixed(1)}s
                </Badge>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="font-medium text-sm sm:text-base">{camera.name}</h2>
            <p className="text-xs text-muted-foreground">{camera.area}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* GIF Ready Notification */}
        {gifBlob && (
          <div className="flex-shrink-0 p-4 border-b bg-muted/50">
            <div className="text-center">
              <h3 className="font-medium text-sm mb-2">🎉 GIF Created!</h3>
              <p className="text-xs text-muted-foreground">
                Your GIF is ready! Check the sharing modal for download and sharing options.
              </p>
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

      {/* Selected Frame Preview */}
      {selectedFrame !== null && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedFrame(null)}
        >
          <div className="relative max-w-4xl w-full">
            <div className="bg-black overflow-hidden rounded-lg aspect-video">
              <img
                src={frames[selectedFrame].url}
                alt={`Frame ${selectedFrame + 1} preview`}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded">
              Frame {selectedFrame + 1} of {frames.length}
            </div>
            <div className="absolute top-4 right-4 bg-black/70 text-white text-sm px-3 py-2 rounded">
              {new Date(frames[selectedFrame].timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}