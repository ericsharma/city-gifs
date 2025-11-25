import { useState, useCallback, useRef } from 'react'
import { useGIFCreator } from './useGIFCreator'

interface CapturedFrame {
  blob: Blob
  timestamp: number
  url: string
}

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
}

export const useFrameCapture = ({
  maxFrames: initialMaxFrames = 30,
  framerate = 2
}: UseFrameCaptureOptions = {}): UseFrameCaptureReturn => {
  const [frames, setFrames] = useState<CapturedFrame[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [maxFrames, setMaxFrames] = useState(initialMaxFrames)
  const framesRef = useRef<CapturedFrame[]>([])
  
  const {
    isCreatingGIF,
    gifBlob,
    progress,
    createGIF: createGIFFromBlobs,
    downloadGIF
  } = useGIFCreator({ framerate, maxFrames })

  // Update ref when frames change
  framesRef.current = frames

  const startCapture = useCallback(() => {
    setIsCapturing(true)
    setFrames([])
    framesRef.current = []
  }, [])

  const stopCapture = useCallback(() => {
    setIsCapturing(false)
  }, [])

  const clearFrames = useCallback(() => {
    // Clean up blob URLs
    frames.forEach(frame => {
      if (frame.url.startsWith('blob:')) {
        URL.revokeObjectURL(frame.url)
      }
    })
    setFrames([])
    framesRef.current = []
    setIsCapturing(false)
  }, [frames])

  const addFrame = useCallback((blob: Blob) => {
    if (!isCapturing) return

    const newFrame: CapturedFrame = {
      blob,
      timestamp: Date.now(),
      url: URL.createObjectURL(blob)
    }


    setFrames(current => {
      const updated = [...current, newFrame]
      framesRef.current = updated
      
      // Auto-stop when max frames reached
      if (updated.length >= maxFrames) {
        setIsCapturing(false)
      }
      
      return updated
    })
  }, [isCapturing, maxFrames])

  const createGIF = useCallback(async () => {
    if (frames.length < 2) {
      throw new Error('Need at least 2 frames to create a GIF')
    }
    
    const blobs = frames.map(frame => frame.blob)
    await createGIFFromBlobs(blobs)
  }, [frames, createGIFFromBlobs])

  return {
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
  }
}