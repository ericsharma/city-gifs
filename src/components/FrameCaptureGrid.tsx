import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { AspectRatio } from './ui/aspect-ratio'
import { 
  Grid3X3,
  Download, 
  Square,
  Timer,
  ImageIcon
} from 'lucide-react'

interface CapturedFrame {
  blob: Blob
  timestamp: number
  url: string
}

interface FrameCaptureGridProps {
  frames: CapturedFrame[]
  isCapturing: boolean
  onStopCapture: () => void
  onCreateGIF: () => void
  onDownloadGIF: () => void
  isCreatingGIF: boolean
  gifBlob: Blob | null
  maxFrames: number
  captureProgress: number
}

export function FrameCaptureGrid({ 
  frames,
  isCapturing,
  onStopCapture,
  onCreateGIF,
  onDownloadGIF,
  isCreatingGIF,
  gifBlob,
  maxFrames,
  captureProgress
}: FrameCaptureGridProps) {
  const estimatedDuration = frames.length > 0 && frames.length > 1 
    ? (frames[frames.length - 1].timestamp - frames[0].timestamp) / 1000 
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Captured Frames
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isCapturing ? "default" : "secondary"}>
              {frames.length}/{maxFrames}
            </Badge>
            {estimatedDuration > 0 && (
              <Badge variant="outline">
                <Timer className="h-3 w-3 mr-1" />
                {estimatedDuration.toFixed(1)}s
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Frame Grid */}
        <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
          {frames.map((frame, index) => (
            <div key={frame.timestamp} className="relative">
              <AspectRatio ratio={16 / 9} className="bg-muted overflow-hidden rounded-md">
                <img
                  src={frame.url}
                  alt={`Frame ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
                  {index + 1}
                </div>
              </AspectRatio>
            </div>
          ))}
          
          {/* Show progress indicator when capturing */}
          {isCapturing && frames.length < maxFrames && (
            <div className="relative">
              <AspectRatio ratio={16 / 9} className="bg-muted/50 border-2 border-dashed border-muted-foreground/50 rounded-md">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-6 w-6 mx-auto mb-1 animate-pulse" />
                    <p className="text-xs">Next</p>
                  </div>
                </div>
              </AspectRatio>
            </div>
          )}
        </div>

        {/* Empty State */}
        {frames.length === 0 && (
          <div className="flex items-center justify-center h-32 text-center text-muted-foreground">
            <div>
              <Grid3X3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No frames captured yet</p>
              <p className="text-xs mt-1">Start capturing to see frames appear here</p>
            </div>
          </div>
        )}

        {/* GIF Preview */}
        {gifBlob && (
          <div className="space-y-3 border-t pt-4">
            <div className="text-center">
              <h3 className="text-sm font-medium mb-3">Generated GIF Preview</h3>
              <div className="inline-block border rounded-lg overflow-hidden bg-muted/50">
                <img
                  src={URL.createObjectURL(gifBlob)}
                  alt="Generated GIF"
                  className="max-w-full max-h-48 object-contain"
                  onLoad={(e) => {
                    // Clean up the blob URL after image loads
                    setTimeout(() => {
                      URL.revokeObjectURL((e.target as HTMLImageElement).src)
                    }, 5000)
                  }}
                />
              </div>
            </div>
            <div className="flex justify-center gap-2">
              <Button
                onClick={onDownloadGIF}
                variant="default"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download GIF
              </Button>
              <Button
                onClick={onCreateGIF}
                variant="outline"
                size="sm"
                disabled={isCreatingGIF}
              >
                {isCreatingGIF ? 'Creating...' : 'Create New GIF'}
              </Button>
            </div>
          </div>
        )}

        {/* Controls */}
        {frames.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Frames captured</span>
              <span className="font-medium">{frames.length}</span>
            </div>
            {estimatedDuration > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{estimatedDuration.toFixed(1)}s</span>
              </div>
            )}
            
            <div className="flex gap-2">
              {isCapturing && (
                <Button 
                  onClick={onStopCapture}
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Early ({frames.length} frames)
                </Button>
              )}
              
              {!isCapturing && frames.length >= 2 && !gifBlob && (
                <Button
                  onClick={onCreateGIF}
                  disabled={isCreatingGIF}
                  size="sm"
                  className="flex-1"
                >
                  {isCreatingGIF ? 'Creating...' : 'Create GIF'}
                </Button>
              )}
            </div>

            {isCreatingGIF && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Creating GIF...</span>
                  <span>{captureProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${captureProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}