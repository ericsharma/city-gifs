import { useState, useCallback } from 'react'
import { useFrameManager, type BaseFrame } from './useFrameManager'
import { useFFmpeg } from './useFFmpeg'

interface UseGIFCreatorOptions {
  framerate?: number
  maxFrames?: number
}

type CapturedFrame = BaseFrame

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
  const [isCreatingGIF, setIsCreatingGIF] = useState(false)
  const [gifBlob, setGifBlob] = useState<Blob | null>(null)
  
  const frameManager = useFrameManager<CapturedFrame>({
    maxFrames,
    createBlobUrl: false,
    defaultSelected: false
  })
  
  const { loadFFmpeg, createGIF: ffmpegCreateGIF, progress, isLoaded } = useFFmpeg()

  const startCapture = useCallback(() => {
    frameManager.startCapture()
    setGifBlob(null)
  }, [frameManager.startCapture])

  const clearFrames = useCallback(() => {
    frameManager.clearFrames()
    setGifBlob(null)
  }, [frameManager.clearFrames])

  const createGIF = useCallback(async (inputBlobs?: Blob[]) => {
    const blobsToUse = inputBlobs || frameManager.frames.map(frame => frame.blob)
    
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
  }, [frameManager.frames, framerate, isLoaded, loadFFmpeg, ffmpegCreateGIF])

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
    frames: frameManager.frames,
    isCapturing: frameManager.isCapturing,
    isCreatingGIF,
    gifBlob,
    progress,
    startCapture,
    stopCapture: frameManager.stopCapture,
    addFrame: frameManager.addFrame,
    createGIF,
    clearFrames,
    downloadGIF
  }
}