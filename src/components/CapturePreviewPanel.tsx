import { useState, useEffect, useRef } from 'react'
import { useCameraPolling } from '../hooks/useCameraPolling'
import type { Camera } from '../types/Camera'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'
import { AspectRatio } from './ui/aspect-ratio'
import { 
  Play, 
  Square, 
  Trash2, 
  Settings, 
  Timer,
  Zap,
  Camera as CameraIcon, 
  Wifi, 
  WifiOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface CapturePreviewPanelProps {
  camera: Camera | null
  pollingInterval: number
  onPollingIntervalChange: (interval: number) => void
  isPollingEnabled: boolean
  onPollingEnabledChange: (enabled: boolean) => void
  isCapturing: boolean
  onStartCapture: () => void
  onStopCapture: () => void
  onClearFrames: () => void
  frameCount: number
  maxFrames: number
  onMaxFramesChange: (frames: number) => void
  onImageUpdate?: (blob: Blob) => void
}

export function CapturePreviewPanel({
  camera,
  pollingInterval,
  onPollingIntervalChange,
  isPollingEnabled,
  onPollingEnabledChange,
  isCapturing,
  onStartCapture,
  onStopCapture,
  onClearFrames,
  frameCount,
  maxFrames,
  onMaxFramesChange,
  onImageUpdate
}: CapturePreviewPanelProps) {
  const [framerate, setFramerate] = useState(2)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const lastTimestampRef = useRef<number>(0)
  
  const { data: cameraImage, isLoading, error } = useCameraPolling({
    cameraId: camera?.id || '',
    imageUrl: camera?.imageUrl || '',
    pollingInterval: pollingInterval * 1000,
    enabled: !!camera && isPollingEnabled
  })

  // Call onImageUpdate only when we get a genuinely new image
  useEffect(() => {
    if (cameraImage?.blob && onImageUpdate && cameraImage.timestamp !== lastTimestampRef.current) {
      lastTimestampRef.current = cameraImage.timestamp
      onImageUpdate(cameraImage.blob)
    }
  }, [cameraImage, onImageUpdate])

  const handleStartCapture = () => {
    if (!isPollingEnabled) {
      onPollingEnabledChange(true)
    }
    onStartCapture()
  }

  if (!camera) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Capture & Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AspectRatio ratio={16 / 9} className="bg-muted flex items-center justify-center mb-4">
            <div className="text-center text-muted-foreground">
              <CameraIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Select a camera to start</p>
            </div>
          </AspectRatio>
          
          <div className="text-center text-sm text-muted-foreground">
            Choose a NYC camera above to begin capturing frames
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Capture & Preview
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isPollingEnabled ? "default" : "secondary"} className="text-xs">
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
            <Badge variant={isCapturing ? "default" : "secondary"} className="text-xs">
              {isCapturing ? "Recording" : "Ready"}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Live Preview */}
        <div>
          <AspectRatio ratio={16 / 9} className="bg-muted overflow-hidden rounded-lg">
            {isLoading && !cameraImage ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div className="text-muted-foreground">
                  <CameraIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Failed to load camera feed</p>
                  <p className="text-xs mt-1">Check connection and try again</p>
                </div>
              </div>
            ) : cameraImage ? (
              <div className="relative h-full">
                <img
                  src={cameraImage.url}
                  alt={`${camera.name} live feed`}
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    if (cameraImage.url.startsWith('blob:')) {
                      setTimeout(() => URL.revokeObjectURL(cameraImage.url), 5000)
                    }
                  }}
                />
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {new Date(cameraImage.timestamp).toLocaleTimeString()}
                </div>
                {isCapturing && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    REC
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <CameraIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Connecting to camera...</p>
                </div>
              </div>
            )}
          </AspectRatio>
          
          <div className="mt-2 text-sm text-muted-foreground">
            <p className="font-medium truncate">{camera.name}</p>
            <div className="flex justify-between items-center text-xs">
              <span>{camera.area}</span>
              {isPollingEnabled && (
                <span>Updates every {pollingInterval}s</span>
              )}
            </div>
          </div>
        </div>

        {/* Capture Controls - Always Visible */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {frameCount}/{maxFrames} frames
              </span>
              <Badge variant={isCapturing ? "default" : "secondary"} className="text-xs">
                {isCapturing ? "Capturing" : "Ready"}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isCapturing ? (
              <Button 
                onClick={handleStartCapture}
                className="flex-1"
                disabled={!isPollingEnabled}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Capture
              </Button>
            ) : (
              <Button 
                onClick={onStopCapture}
                variant="destructive"
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Capture
              </Button>
            )}
            
            {frameCount > 0 && !isCapturing && (
              <Button
                onClick={onClearFrames}
                variant="outline"
                size="icon"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {isCapturing && (
            <div className="text-xs text-muted-foreground text-center bg-muted/50 p-2 rounded">
              Capturing every {pollingInterval}s • {maxFrames - frameCount} frames remaining
            </div>
          )}
        </div>

        {/* Advanced Settings - Collapsible */}
        <div className="border-t pt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mb-4" 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Advanced Settings
            {isSettingsOpen ? (
              <ChevronUp className="h-4 w-4 ml-auto" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-auto" />
            )}
          </Button>
          
          {isSettingsOpen && (
            <div className="space-y-4">
            {/* Polling Controls */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Camera Polling
              </h4>
              
              <div className="flex items-center justify-between">
                <label className="text-sm">Live Updates</label>
                <Switch
                  checked={isPollingEnabled}
                  onCheckedChange={onPollingEnabledChange}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm">Poll Interval (seconds)</label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={pollingInterval}
                  onChange={(e) => onPollingIntervalChange(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Capture Settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Capture Settings
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm">Framerate (FPS)</label>
                  <Input
                    type="number"
                    min={0.5}
                    max={10}
                    step={0.5}
                    value={framerate}
                    onChange={(e) => setFramerate(Number(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm">Max Frames</label>
                  <Input
                    type="number"
                    min={5}
                    max={200}
                    value={maxFrames}
                    onChange={(e) => onMaxFramesChange(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}