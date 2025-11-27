import { useEffect, useRef, useState } from 'react';
import { AspectRatio } from './ui/aspect-ratio';
import { Button } from './ui/button';
import { 
  ImageIcon,
  Trash2,
  RefreshCw,
  Check
} from 'lucide-react';

interface CapturedFrame {
  blob: Blob;
  timestamp: number;
  url: string;
  selected?: boolean;
}

interface ScrollableFrameGridProps {
  frames: CapturedFrame[];
  selectedFrame: number | null;
  onFrameClick: (index: number) => void;
  onFrameSelectionToggle: (index: number) => void;
  onCreateGIF?: () => void;
  onClearFrames?: () => void;
  isCreatingGIF?: boolean;
  captureProgress?: number;
  gifBlob?: Blob | null;
  estimatedDuration?: number;
}

export function ScrollableFrameGrid({ 
  frames, 
  selectedFrame, 
  onFrameClick,
  onFrameSelectionToggle,
  onCreateGIF,
  onClearFrames,
  isCreatingGIF = false,
  captureProgress = 0,
  gifBlob,
  estimatedDuration = 0
}: ScrollableFrameGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleFrames, setVisibleFrames] = useState<CapturedFrame[]>([]);
  const [loadedCount, setLoadedCount] = useState(20); // Start with 20 frames

  useEffect(() => {
    setVisibleFrames(frames.slice(0, Math.min(loadedCount, frames.length)));
  }, [frames, loadedCount]);

  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // Load more when scrolled 80% down
    if (scrollPercentage > 0.8 && loadedCount < frames.length) {
      setLoadedCount(prev => Math.min(prev + 10, frames.length));
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadedCount, frames.length]);

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto overscroll-contain"
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        height: '100%',
        maxHeight: 'calc(100vh - 200px)' // Ensure it doesn't exceed viewport
      }}
    >
      <div className="p-4">
        <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Individual Frames ({visibleFrames.length}/{frames.length})
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-6">
          {visibleFrames.map((frame, index) => {
            const isSelected = frame.selected !== false; // Default to true if undefined
            const isPreviewSelected = selectedFrame === index;
            
            return (
              <div 
                key={frame.timestamp}
                className={`relative transition-all hover:scale-105 touch-manipulation ${
                  isPreviewSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                } ${!isSelected ? 'opacity-60' : ''}`}
                style={{
                  touchAction: 'manipulation'
                }}
              >
                <AspectRatio ratio={16 / 9} className="bg-muted overflow-hidden rounded-lg">
                  {/* Main image - click for preview */}
                  <img
                    src={frame.url}
                    alt={`Frame ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    loading="lazy"
                    onClick={() => onFrameClick(isPreviewSelected ? -1 : index)}
                  />
                  
                  {/* Frame number */}
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    {index + 1}
                  </div>
                  
                  {/* Selection checkbox overlay */}
                  <div 
                    className="absolute top-2 left-2 cursor-pointer touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering preview
                      onFrameSelectionToggle(index);
                    }}
                  >
                    <div 
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-green-500 border-green-500' 
                          : 'bg-black/30 border-white/70 hover:bg-black/50'
                      }`}
                    >
                      {isSelected && (
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      )}
                    </div>
                  </div>
                </AspectRatio>
              </div>
            );
          })}
        </div>
        
        {loadedCount < frames.length && (
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">
              Loading more frames...
            </div>
          </div>
        )}

        {/* Bottom Actions Section */}
        <div className="border-t bg-background/95 backdrop-blur-sm mt-6">
          <div className="p-4 space-y-4">
            {/* Stats */}
            <div className="flex justify-between items-center text-sm">
              <div className="flex gap-4">
                <span className="text-muted-foreground">
                  Selected: <span className="font-medium text-foreground">{frames.filter(f => f.selected !== false).length}</span>
                  <span className="text-muted-foreground/70"> / {frames.length}</span>
                </span>
                {estimatedDuration > 0 && (
                  <span className="text-muted-foreground">
                    Duration: <span className="font-medium text-foreground">{estimatedDuration.toFixed(1)}s</span>
                  </span>
                )}
              </div>
            </div>

            {/* GIF Creation Progress */}
            {isCreatingGIF && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Creating GIF...</span>
                  <span className="font-medium">{captureProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${captureProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {onClearFrames && (
                <Button
                  variant="outline"
                  onClick={onClearFrames}
                  className="flex-1"
                  disabled={isCreatingGIF}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
              
              {onCreateGIF && (
                <>
                  {!gifBlob ? (
                    <Button
                      onClick={onCreateGIF}
                      disabled={isCreatingGIF || frames.filter(f => f.selected !== false).length < 2}
                      className="flex-1"
                    >
                      {isCreatingGIF ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Create GIF
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={onCreateGIF}
                      disabled={isCreatingGIF}
                      variant="outline"
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Recreate GIF
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Helpful tip */}
            {frames.filter(f => f.selected !== false).length < 2 && (
              <p className="text-xs text-muted-foreground text-center">
                Select at least 2 frames to create a GIF
              </p>
            )}
          </div>
        </div>
        
        {/* Extra padding to ensure scroll reaches bottom */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}