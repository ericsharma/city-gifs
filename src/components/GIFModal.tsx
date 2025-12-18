import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { 
  Download, 
  Share2, 
  ChevronDown, 
  Copy, 
  RotateCcw
} from 'lucide-react'

interface GIFModalProps {
  isOpen: boolean
  onClose: () => void
  gifBlob: Blob | null
  onDownloadGIF: () => void
  onCreateNewGIF: () => void
  isCreatingGIF: boolean
  camera?: { name: string; area: string }
}

export function GIFModal({
  isOpen,
  onClose,
  gifBlob,
  onDownloadGIF,
  onCreateNewGIF,
  isCreatingGIF,
  camera
}: GIFModalProps) {
  const [showShareMenu, setShowShareMenu] = useState(false)
  const shareMenuRef = useRef<HTMLDivElement>(null)
  const [gifImageUrl, setGifImageUrl] = useState<string | null>(null)

  // Create and cleanup GIF URL
  useEffect(() => {
    if (gifBlob) {
      const url = URL.createObjectURL(gifBlob)
      setGifImageUrl(url)
      
      return () => {
        URL.revokeObjectURL(url)
        setGifImageUrl(null)
      }
    }
  }, [gifBlob])

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false)
      }
    }

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showShareMenu])

  const getShareText = () => 
    camera 
      ? `Check out this live GIF from ${camera.name} in ${camera.area} - NYC Camera GIFs`
      : 'Check out this NYC Camera GIF!'

  const handleNativeShare = async () => {
    if (gifBlob && navigator.share) {
      try {
        const file = new File([gifBlob], 'nyc-camera.gif', { type: 'image/gif' })
        const shareText = camera 
          ? `${getShareText()}\n\nCreated with ${window.location.origin}`
          : `Check out this NYC Camera GIF!\n\nCreated with ${window.location.origin}`
        
        await navigator.share({
          title: 'NYC Camera GIF',
          text: shareText,
          files: [file]
        })
      } catch (error) {
        console.log('Share failed:', error)
        onDownloadGIF()
      }
    } else {
      onDownloadGIF()
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Camera link copied to clipboard!')
      toast.info('Note: This links to the live camera, not your specific GIF')
    } catch (error) {
      console.log('Copy failed:', error)
      toast.error('Failed to copy link')
    }
  }

  if (!gifBlob) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>
            Generated GIF Preview
          </DialogTitle>
          <DialogDescription>
            Your GIF has been successfully created from the captured frames.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="border rounded-lg overflow-hidden bg-muted/50 max-w-full">
              {gifImageUrl && (
                <img
                  src={gifImageUrl}
                  alt="Generated GIF"
                  className="max-w-full max-h-64 object-contain"
                />
              )}
            </div>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Size: {(gifBlob.size / 1024 / 1024).toFixed(2)} MB
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3">
          <div className="flex gap-2 w-full">
            <div className="relative flex-1" ref={shareMenuRef}>
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => setShowShareMenu(!showShareMenu)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share GIF
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
              
              {showShareMenu && (
                <div className="absolute bottom-full mb-1 left-0 right-0 bg-background border rounded-lg shadow-lg z-50">
                  {'share' in navigator && (
                    <button
                      onClick={() => { handleNativeShare(); setShowShareMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-muted flex items-center gap-3 first:rounded-t-lg"
                    >
                      <Share2 className="h-4 w-4" />
                      <div>
                        <div>Share GIF File</div>
                        <div className="text-xs text-muted-foreground">Shares actual GIF</div>
                      </div>
                    </button>
                  )}
                  <button
                    onClick={() => { handleCopyLink(); setShowShareMenu(false); }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-muted flex items-center gap-3"
                  >
                    <Copy className="h-4 w-4" />
                    <div>
                      <div>Copy Camera Link</div>
                      <div className="text-xs text-muted-foreground">Links to live feed</div>
                    </div>
                  </button>
                  <hr className="border-muted" />
                  <button
                    onClick={() => { onDownloadGIF(); setShowShareMenu(false); }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-muted flex items-center gap-3 last:rounded-b-lg"
                  >
                    <Download className="h-4 w-4" />
                    Download GIF
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <Button
            onClick={onCreateNewGIF}
            variant="outline"
            disabled={isCreatingGIF}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {isCreatingGIF ? 'Creating...' : 'Create New GIF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}