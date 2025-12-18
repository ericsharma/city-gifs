import { useState, useCallback, useRef } from 'react'

export interface BaseFrame {
  blob: Blob
  timestamp: number
}

export interface ExtendedFrame extends BaseFrame {
  url: string
  selected?: boolean
}

interface UseFrameManagerOptions {
  maxFrames: number
  createBlobUrl?: boolean // Whether to create blob URLs for frames
  defaultSelected?: boolean // Default selection state for frames
}

interface UseFrameManagerReturn<T extends BaseFrame> {
  frames: T[]
  isCapturing: boolean
  framesRef: React.MutableRefObject<T[]>
  setFrames: React.Dispatch<React.SetStateAction<T[]>>
  setIsCapturing: React.Dispatch<React.SetStateAction<boolean>>
  startCapture: () => void
  stopCapture: () => void
  addFrame: (blob: Blob) => T
  clearFrames: () => void
  toggleFrameSelection: (index: number) => void // Only works with ExtendedFrame
}

export const useFrameManager = <T extends BaseFrame = BaseFrame>({
  maxFrames,
  createBlobUrl = false,
  defaultSelected = true
}: UseFrameManagerOptions): UseFrameManagerReturn<T> => {
  const [frames, setFrames] = useState<T[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const framesRef = useRef<T[]>([])

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
    // Clean up blob URLs if they exist
    setFrames(current => {
      current.forEach(frame => {
        if ('url' in frame && typeof frame.url === 'string' && frame.url.startsWith('blob:')) {
          URL.revokeObjectURL(frame.url)
        }
      })
      return []
    })
    framesRef.current = []
    setIsCapturing(false)
  }, [])

  const addFrame = useCallback((blob: Blob): T => {
    const baseFrame: BaseFrame = {
      blob,
      timestamp: Date.now()
    }
    
    const newFrame = createBlobUrl 
      ? ({
          ...baseFrame,
          url: URL.createObjectURL(blob),
          selected: defaultSelected
        } as unknown as T)
      : (baseFrame as unknown as T)

    if (!isCapturing) {
      // Still create and return frame even if not capturing for flexibility
      return newFrame
    }

    setFrames(current => {
      const updated = [...current, newFrame]
      framesRef.current = updated
      
      // Auto-stop when max frames reached
      if (updated.length >= maxFrames) {
        setIsCapturing(false)
      }
      
      // Trim frames if over limit (for useGIFCreator behavior)
      return updated.length > maxFrames 
        ? updated.slice(-maxFrames)
        : updated
    })

    return newFrame
  }, [isCapturing, maxFrames, createBlobUrl, defaultSelected])

  const toggleFrameSelection = useCallback((index: number) => {
    setFrames(current => 
      current.map((frame, i) => {
        if (i === index && 'selected' in frame) {
          return {
            ...frame,
            selected: !(frame as any).selected
          } as T
        }
        return frame
      })
    )
  }, [])

  return {
    frames,
    isCapturing,
    framesRef,
    setFrames,
    setIsCapturing,
    startCapture,
    stopCapture,
    addFrame,
    clearFrames,
    toggleFrameSelection
  }
}