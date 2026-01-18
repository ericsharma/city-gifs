import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Play, Radio, RadioTower, Share2 } from 'lucide-react'
import type { Camera } from '../../types/Camera'

interface CameraPopupCardProps {
  camera: Camera
  isLoading?: boolean
  onClose: () => void
  onStartPreview?: (camera: Camera) => void
  onShare?: (camera: Camera) => void
}

export function CameraPopupCard({
  camera,
  isLoading,
  onClose,
  onStartPreview,
  onShare
}: CameraPopupCardProps) {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  const handleStartPreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStartPreview?.(camera)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    onShare?.(camera)
  }

  return (
    <div className="relative bg-card text-card-foreground rounded-lg border shadow-lg min-w-[240px] max-w-[280px] overflow-hidden">
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-background/80 backdrop-blur-sm hover:bg-background transition-colors border border-border/50 shadow-sm"
        aria-label="Close popup"
      >
        <X className="size-3.5 text-muted-foreground" />
      </button>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header Section */}
        <div className="pr-6 space-y-2">
          {/* Camera Name - Most Prominent */}
          <h3 className="text-base font-semibold leading-tight text-foreground">
            {camera.name}
          </h3>

          {/* Area and Status Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {camera.area}
            </p>
            <Badge
              variant={camera.isOnline ? "default" : "secondary"}
              className={camera.isOnline
                ? "bg-green-500/90 hover:bg-green-500 border-green-600/20 text-white dark:bg-green-600/80 dark:hover:bg-green-600"
                : "bg-gray-400/90 hover:bg-gray-400 border-gray-500/20 text-white dark:bg-gray-600/80 dark:hover:bg-gray-600"
              }
            >
              {camera.isOnline ? (
                <>
                  <Radio className="size-3" />
                  Live
                </>
              ) : (
                <>
                  <RadioTower className="size-3" />
                  Offline
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Start Preview Button */}
          {onStartPreview && camera.isOnline && (
            <Button
              onClick={handleStartPreview}
              disabled={isLoading}
              size="sm"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <Play className="size-4 mr-2" />
                  Start Live Preview
                </>
              )}
            </Button>
          )}

          {/* Share Button */}
          <Button
            onClick={handleShare}
            size="sm"
            variant="outline"
            className="w-full"
          >
            <Share2 className="size-4 mr-2" />
            Share Camera
          </Button>
        </div>

        {/* Offline Message */}
        {!camera.isOnline && (
          <div className="text-xs text-muted-foreground text-center py-1">
            Camera is currently offline
          </div>
        )}
      </div>
    </div>
  )
}
