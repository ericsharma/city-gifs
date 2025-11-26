import { Button } from './ui/button'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Download, X } from 'lucide-react'

interface GIFModalProps {
  isOpen: boolean
  onClose: () => void
  gifBlob: Blob | null
  onDownloadGIF: () => void
  onCreateNewGIF: () => void
  isCreatingGIF: boolean
}

export function GIFModal({
  isOpen,
  onClose,
  gifBlob,
  onDownloadGIF,
  onCreateNewGIF,
  isCreatingGIF
}: GIFModalProps) {
  if (!gifBlob) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Generated GIF Preview
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Your GIF has been successfully created from the captured frames.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="border rounded-lg overflow-hidden bg-muted/50 max-w-full">
              <img
                src={URL.createObjectURL(gifBlob)}
                alt="Generated GIF"
                className="max-w-full max-h-64 object-contain"
                onLoad={(e) => {
                  // Clean up the blob URL after image loads
                  setTimeout(() => {
                    URL.revokeObjectURL((e.target as HTMLImageElement).src)
                  }, 5000)
                }}
              />
            </div>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Size: {(gifBlob.size / 1024 / 1024).toFixed(2)} MB
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            onClick={onCreateNewGIF}
            variant="outline"
            disabled={isCreatingGIF}
            className="w-full sm:w-auto"
          >
            {isCreatingGIF ? 'Creating...' : 'Create New GIF'}
          </Button>
          <Button
            onClick={onDownloadGIF}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Download GIF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}