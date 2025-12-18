import { useState, useCallback } from 'react'
import { useFrameManager, type ExtendedFrame } from './useFrameManager'
import { useGIFCreator } from './useGIFCreator'

type CapturedFrame = ExtendedFrame

interface UseFrameCaptureOptions {
  maxFrames?: number
  framerate?: number
}

interface UseFrameCaptureReturn {
  frames: CapturedFrame[]
  isCapturing: boolean
  isCreatingGIF: boolean
  gifBlob: Blob | null
  progress: number
  maxFrames: number
  startCapture: () => void
  stopCapture: () => void
  clearFrames: () => void
  addFrame: (blob: Blob) => void
  createGIF: () => Promise<void>
  downloadGIF: () => void
  setMaxFrames: (frames: number) => void
  toggleFrameSelection: (index: number) => void
}

export const useFrameCapture = ({
  maxFrames: initialMaxFrames = 30,
  framerate = 2
}: UseFrameCaptureOptions = {}): UseFrameCaptureReturn => {
  const [maxFrames, setMaxFrames] = useState(initialMaxFrames)
  
  const frameManager = useFrameManager<CapturedFrame>({
    maxFrames,
    createBlobUrl: true,
    defaultSelected: true
  })
  
  const {
    isCreatingGIF,
    gifBlob,
    progress,
    createGIF: createGIFFromBlobs,
    downloadGIF,
    clearFrames: clearGIFState
  } = useGIFCreator({ framerate, maxFrames })

  const startCapture = useCallback(() => {
    frameManager.startCapture()
    // Clear any existing GIF blob to prevent UI overlap
    clearGIFState()
  }, [frameManager.startCapture, clearGIFState])

  const clearFrames = useCallback(() => {
    frameManager.clearFrames()
  }, [frameManager.clearFrames])

  const addFrame = useCallback((blob: Blob) => {
    frameManager.addFrame(blob)
  }, [frameManager.addFrame])

  const createGIF = useCallback(async () => {
    const selectedFrames = frameManager.frames.filter(frame => frame.selected !== false)
    if (selectedFrames.length < 2) {
      throw new Error('Need at least 2 selected frames to create a GIF')
    }
    
    const blobs = selectedFrames.map(frame => frame.blob)
    await createGIFFromBlobs(blobs)
  }, [frameManager.frames, createGIFFromBlobs])

  return {
    frames: frameManager.frames,
    isCapturing: frameManager.isCapturing,
    isCreatingGIF,
    gifBlob,
    progress,
    maxFrames,
    startCapture,
    stopCapture: frameManager.stopCapture,
    clearFrames,
    addFrame,
    createGIF,
    downloadGIF,
    setMaxFrames,
    toggleFrameSelection: frameManager.toggleFrameSelection
  }
}