import { useState } from 'react'
import type { Camera } from './types/Camera'
import { CameraSelector } from './components/CameraSelector'
import { CameraPreview } from './components/CameraPreview'
import { GIFControls } from './components/GIFControls'
import { FrameCaptureGrid } from './components/FrameCaptureGrid'
import { useFrameCapture } from './hooks/useFrameCapture'

// Import the camera data
import { allCameras } from './data/cameras'

function App() {
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null)
  const [pollingInterval, setPollingInterval] = useState(3)
  const [isPollingEnabled, setIsPollingEnabled] = useState(false)
  
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">NYC Camera GIFs</h1>
          <p className="text-muted-foreground mt-2">
            Create live GIFs from New York City traffic cameras
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Camera Selection */}
          <div className="space-y-6">
            <CameraSelector
              cameras={allCameras}
              selectedCamera={selectedCamera}
              onCameraSelect={handleCameraSelect}
            />
            
            <GIFControls
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
            />
          </div>

          {/* Camera Preview */}
          <div>
            <CameraPreview
              camera={selectedCamera}
              pollingInterval={pollingInterval}
              isPollingEnabled={isPollingEnabled}
              onImageUpdate={handleImageUpdate}
            />
          </div>

          {/* Frame Capture Grid */}
          <div>
            <FrameCaptureGrid
              frames={frames}
              isCapturing={isCapturing}
              onStopCapture={stopCapture}
              onCreateGIF={createGIF}
              onDownloadGIF={downloadGIF}
              isCreatingGIF={isCreatingGIF}
              gifBlob={gifBlob}
              maxFrames={maxFrames}
              captureProgress={progress}
            />
          </div>
        </div>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
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
