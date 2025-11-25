import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'
import { 
  Play, 
  Square, 
  Trash2, 
  Settings, 
  Timer,
  Zap
} from 'lucide-react'

interface GIFControlsProps {
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
}

export function GIFControls({
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
  onMaxFramesChange
}: GIFControlsProps) {
  const [framerate, setFramerate] = useState(2)

  const handleStartCapture = () => {
    if (!isPollingEnabled) {
      onPollingEnabledChange(true)
    }
    onStartCapture()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Capture Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {/* Capture Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={isCapturing ? "default" : "secondary"}>
                {isCapturing ? "Capturing" : "Ready"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {frameCount}/{maxFrames} frames
              </span>
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
            <div className="text-xs text-muted-foreground text-center">
              Capturing every {pollingInterval}s • {maxFrames - frameCount} frames remaining
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}