import { useState, useEffect } from 'react'
import type { Camera } from './types/Camera'
import { FullScreenCameraSelector } from './components/FullScreenCameraSelector'
import { FullScreenLivePreview } from './components/FullScreenLivePreview'
import { FullScreenCapturedFrames } from './components/FullScreenCapturedFrames'
import { GIFModal } from './components/GIFModal'
import { useFrameCapture } from './hooks/useFrameCapture'

// Import the camera data
import { allCameras } from './data/cameras'

type AppScreen = 'camera-selection' | 'live-preview' | 'captured-frames'

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('camera-selection')
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
    setMaxFrames,
    toggleFrameSelection
  } = useFrameCapture({
    maxFrames: 30,
    framerate: 2
  })
  
  const handleCameraSelect = (camera: Camera) => {
    setSelectedCamera(camera)
    setIsPollingEnabled(true)
    setCurrentScreen('live-preview')
  }

  const handleBackToCamera = () => {
    setCurrentScreen('camera-selection')
    setSelectedCamera(null)
    setIsPollingEnabled(false)
  }

  const handleViewFrames = () => {
    setCurrentScreen('captured-frames')
  }

  const handleBackToPreview = () => {
    setCurrentScreen('live-preview')
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

  // Render current screen
  if (currentScreen === 'camera-selection') {
    return (
      <FullScreenCameraSelector
        cameras={allCameras}
        onCameraSelect={handleCameraSelect}
        isLoading={false}
      />
    )
  }

  if (currentScreen === 'live-preview' && selectedCamera) {
    return (
      <FullScreenLivePreview
        camera={selectedCamera}
        pollingInterval={pollingInterval}
        onPollingIntervalChange={setPollingInterval}
        isPollingEnabled={isPollingEnabled}
        onPollingEnabledChange={setIsPollingEnabled}
        isCapturing={isCapturing}
        onStartCapture={startCapture}
        onStopCapture={stopCapture}
        frameCount={frames.length}
        maxFrames={maxFrames}
        onMaxFramesChange={setMaxFrames}
        onImageUpdate={handleImageUpdate}
        onBackToCamera={handleBackToCamera}
        onViewFrames={handleViewFrames}
      />
    )
  }

  if (currentScreen === 'captured-frames' && selectedCamera) {
    return (
      <div>
        <FullScreenCapturedFrames
          frames={frames}
          camera={selectedCamera}
          onBackToPreview={handleBackToPreview}
          onClearFrames={clearFrames}
          onCreateGIF={handleCreateGIF}
          onFrameSelectionToggle={toggleFrameSelection}
          isCreatingGIF={isCreatingGIF}
          captureProgress={progress}
          gifBlob={gifBlob}
          onDownloadGIF={downloadGIF}
        />
        
        {/* GIF Modal */}
        <GIFModal
          isOpen={isGifModalOpen}
          onClose={handleGifModalClose}
          gifBlob={gifBlob}
          onDownloadGIF={downloadGIF}
          onCreateNewGIF={handleCreateGIF}
          isCreatingGIF={isCreatingGIF}
        />
      </div>
    )
  }

  // Fallback - shouldn't happen but return to camera selection
  return (
    <FullScreenCameraSelector
      cameras={allCameras}
      onCameraSelect={handleCameraSelect}
      isLoading={false}
    />
  )
}

export default App
