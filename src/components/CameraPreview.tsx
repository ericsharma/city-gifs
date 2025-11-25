import { useEffect, useRef } from 'react'
import { useCameraPolling } from '../hooks/useCameraPolling'
import type { Camera } from '../types/Camera'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { AspectRatio } from './ui/aspect-ratio'
import { Badge } from './ui/badge'
import { Camera as CameraIcon, Wifi, WifiOff } from 'lucide-react'

interface CameraPreviewProps {
  camera: Camera | null
  pollingInterval: number
  isPollingEnabled: boolean
  onImageUpdate?: (blob: Blob) => void
}

export function CameraPreview({ 
  camera, 
  pollingInterval, 
  isPollingEnabled,
  onImageUpdate
}: CameraPreviewProps) {
  const lastTimestampRef = useRef<number>(0)
  
  const { data: cameraImage, isLoading, error } = useCameraPolling({
    cameraId: camera?.id || '',
    imageUrl: camera?.imageUrl || '',
    pollingInterval: pollingInterval * 1000, // Convert to milliseconds
    enabled: !!camera && isPollingEnabled
  })

  // Call onImageUpdate only when we get a genuinely new image
  useEffect(() => {
    if (cameraImage?.blob && onImageUpdate && cameraImage.timestamp !== lastTimestampRef.current) {
      lastTimestampRef.current = cameraImage.timestamp
      onImageUpdate(cameraImage.blob)
    }
  }, [cameraImage, onImageUpdate])

  if (!camera) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CameraIcon className="h-5 w-5" />
            Camera Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AspectRatio ratio={16 / 9} className="bg-muted flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <CameraIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Select a camera to start preview</p>
            </div>
          </AspectRatio>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CameraIcon className="h-5 w-5" />
            Live Preview
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isPollingEnabled ? "default" : "secondary"}>
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
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                  // Cleanup previous URL to prevent memory leaks
                  if (cameraImage.url.startsWith('blob:')) {
                    setTimeout(() => URL.revokeObjectURL(cameraImage.url), 5000)
                  }
                }}
              />
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {new Date(cameraImage.timestamp).toLocaleTimeString()}
              </div>
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
        
        <div className="mt-3 text-sm text-muted-foreground">
          <p className="font-medium truncate">{camera.name}</p>
          <p className="text-xs">{camera.area}</p>
          {isPollingEnabled && (
            <p className="text-xs mt-1">
              Updates every {pollingInterval}s
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}