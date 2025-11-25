import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { AspectRatio } from './ui/aspect-ratio'
import { Button } from './ui/button'
import { Image, Download, FileImage } from 'lucide-react'

interface GIFPreviewProps {
  gifBlob: Blob | null
  frames: Array<{ blob: Blob; timestamp: number }>
  onDownload?: () => void
}

export function GIFPreview({ gifBlob, frames, onDownload }: GIFPreviewProps) {
  const gifUrl = gifBlob ? URL.createObjectURL(gifBlob) : null
  const fileSizeKB = gifBlob ? Math.round(gifBlob.size / 1024) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            GIF Preview
          </div>
          {gifBlob && (
            <Badge variant="outline">
              {fileSizeKB} KB
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AspectRatio ratio={16 / 9} className="bg-muted overflow-hidden rounded-lg">
          {gifUrl ? (
            <div className="relative h-full">
              <img
                src={gifUrl}
                alt="Generated GIF"
                className="w-full h-full object-cover"
                onLoad={() => {
                  // Cleanup URL after a delay to prevent memory leaks
                  setTimeout(() => {
                    if (gifUrl.startsWith('blob:')) {
                      URL.revokeObjectURL(gifUrl)
                    }
                  }, 10000)
                }}
              />
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                GIF
              </div>
            </div>
          ) : frames.length > 0 ? (
            <div className="flex items-center justify-center h-full text-center p-4">
              <div className="text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Ready to Create GIF</p>
                <p className="text-xs mt-1">{frames.length} frames captured</p>
                <p className="text-xs">Click "Create GIF" to generate</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center p-4">
              <div className="text-muted-foreground">
                <FileImage className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No GIF created yet</p>
                <p className="text-xs mt-1">Start capturing frames to create a GIF</p>
              </div>
            </div>
          )}
        </AspectRatio>

        {gifBlob && (
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">File size</span>
              <span>{fileSizeKB} KB</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Frames</span>
              <span>{frames.length}</span>
            </div>
            {onDownload && (
              <Button 
                onClick={onDownload} 
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Download GIF
              </Button>
            )}
          </div>
        )}

        {frames.length > 0 && !gifBlob && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Frames captured</span>
              <span className="font-medium">{frames.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">
                {frames.length > 1 
                  ? `${((frames[frames.length - 1].timestamp - frames[0].timestamp) / 1000).toFixed(1)}s`
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}