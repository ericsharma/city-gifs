import { useState, useCallback } from 'react'
import { useFFmpeg } from './useFFmpeg'

interface UseGIFCreatorOptions {
  framerate?: number
  maxFrames?: number
}

interface CapturedFrame {
  blob: Blob
  timestamp: number
}

interface UseGIFCreatorReturn {
  frames: CapturedFrame[]
  isCapturing: boolean
  isCreatingGIF: boolean
  gifBlob: Blob | null
  progress: number
  startCapture: () => void
  stopCapture: () => void
  addFrame: (blob: Blob) => void
  createGIF: (inputBlobs?: Blob[]) => Promise<void>
  clearFrames: () => void
  downloadGIF: () => void
}

export const useGIFCreator = ({
  framerate = 2,
  maxFrames = 50
}: UseGIFCreatorOptions = {}): UseGIFCreatorReturn => {
  const [frames, setFrames] = useState<CapturedFrame[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [isCreatingGIF, setIsCreatingGIF] = useState(false)
  const [gifBlob, setGifBlob] = useState<Blob | null>(null)
  
  const { loadFFmpeg, createGIF: ffmpegCreateGIF, progress, isLoaded } = useFFmpeg()

  const startCapture = useCallback(() => {
    setIsCapturing(true)
    setFrames([])
    setGifBlob(null)
  }, [])

  const stopCapture = useCallback(() => {
    setIsCapturing(false)
  }, [])

  const addFrame = useCallback((blob: Blob) => {
    if (!isCapturing) return
    
    setFrames(current => {
      const newFrame: CapturedFrame = {
        blob,
        timestamp: Date.now()
      }
      
      const updatedFrames = [...current, newFrame]
      
      if (updatedFrames.length > maxFrames) {
        return updatedFrames.slice(-maxFrames)
      }
      
      return updatedFrames
    })
  }, [isCapturing, maxFrames])

  const createGIF = useCallback(async (inputBlobs?: Blob[]) => {
    const blobsToUse = inputBlobs || frames.map(frame => frame.blob)
    
    if (blobsToUse.length === 0) {
      throw new Error('No frames provided')
    }
    
    setIsCreatingGIF(true)
    setGifBlob(null)
    
    try {
      if (!isLoaded) {
        await loadFFmpeg()
      }
      
      const gif = await ffmpegCreateGIF(blobsToUse, framerate)
      setGifBlob(gif)
    } catch (error) {
      console.error('Failed to create GIF:', error)
      throw error
    } finally {
      setIsCreatingGIF(false)
    }
  }, [frames, framerate, isLoaded, loadFFmpeg, ffmpegCreateGIF])

  const clearFrames = useCallback(() => {
    setFrames([])
    setGifBlob(null)
    setIsCapturing(false)
  }, [])

  const downloadGIF = useCallback(() => {
    if (!gifBlob) return
    
    const url = URL.createObjectURL(gifBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `nyc-camera-${Date.now()}.gif`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [gifBlob])

  return {
    frames,
    isCapturing,
    isCreatingGIF,
    gifBlob,
    progress,
    startCapture,
    stopCapture,
    addFrame,
    createGIF,
    clearFrames,
    downloadGIF
  }
}