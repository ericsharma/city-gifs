import { useState, useEffect } from 'react'
import type { Camera } from './types/Camera'
import { CameraSelector } from './components/CameraSelector'
import { CapturePreviewPanel } from './components/CapturePreviewPanel'
import { FrameCaptureGrid } from './components/FrameCaptureGrid'
import { GIFModal } from './components/GIFModal'
import { useFrameCapture } from './hooks/useFrameCapture'

// Import the camera data
import { allCameras } from './data/cameras'

function App() {
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null)
  const [pollingInterval, setPollingInterval] = useState(3)
  const [isPollingEnabled, setIsPollingEnabled] = useState(false)
  const [isGifModalOpen, setIsGifModalOpen] = useState(false)
  
  const {
    frames,
    isCapturing,
    isCreatingGIF,
    gifBlob,
    progress,
    maxFrames,
    startCapture,
    stopCapture,
    clearFrames,
    addFrame,
    createGIF,
    downloadGIF,
    setMaxFrames
  } = useFrameCapture({
    maxFrames: 30,
    framerate: 2
  })
  
  const handleCameraSelect = (camera: Camera) => {
    setSelectedCamera(camera)
    setIsPollingEnabled(true)
  }

  const handleImageUpdate = (blob: Blob) => {
    if (isCapturing) {
      addFrame(blob)
    }
  }

  const handleCreateGIF = async () => {
    await createGIF()
    // Modal will open when gifBlob changes via useEffect
  }

  // Open modal when GIF is created
  useEffect(() => {
    if (gifBlob && !isCreatingGIF) {
      setIsGifModalOpen(true)
    }
  }, [gifBlob, isCreatingGIF])

  const handleGifModalClose = () => {
    setIsGifModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">NYC Camera GIFs</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Create live GIFs from New York City traffic cameras
          </p>
        </header>

        {/* Mobile-first single column layout */}
        <div className="space-y-6">
          {/* 1. Camera Selection */}
          <CameraSelector
            cameras={allCameras}
            selectedCamera={selectedCamera}
            onCameraSelect={handleCameraSelect}
          />

          {/* 2. Combined Capture & Preview */}
          <CapturePreviewPanel
            camera={selectedCamera}
            pollingInterval={pollingInterval}
            onPollingIntervalChange={setPollingInterval}
            isPollingEnabled={isPollingEnabled}
            onPollingEnabledChange={setIsPollingEnabled}
            isCapturing={isCapturing}
            onStartCapture={startCapture}
            onStopCapture={stopCapture}
            onClearFrames={clearFrames}
            frameCount={frames.length}
            maxFrames={maxFrames}
            onMaxFramesChange={setMaxFrames}
            onImageUpdate={handleImageUpdate}
          />

          {/* 3. Captured Frames */}
          <FrameCaptureGrid
            frames={frames}
            isCapturing={isCapturing}
            onStopCapture={stopCapture}
            onCreateGIF={handleCreateGIF}
            isCreatingGIF={isCreatingGIF}
            maxFrames={maxFrames}
            captureProgress={progress}
          />
        </div>

        {/* 4. GIF Modal */}
        <GIFModal
          isOpen={isGifModalOpen}
          onClose={handleGifModalClose}
          gifBlob={gifBlob}
          onDownloadGIF={downloadGIF}
          onCreateNewGIF={handleCreateGIF}
          isCreatingGIF={isCreatingGIF}
        />

        <footer className="mt-8 text-center text-xs sm:text-sm text-muted-foreground">
          <p>
            Camera feeds provided by NYC Department of Transportation. 
            Built with React, TypeScript, and FFmpeg.wasm.
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
