import { useRef, useState, useCallback } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'

interface UseFFmpegReturn {
  isLoaded: boolean
  isLoading: boolean
  loadFFmpeg: () => Promise<void>
  createGIF: (images: Blob[], framerate?: number) => Promise<Blob>
  progress: number
}

export const useFFmpeg = (): UseFFmpegReturn => {
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const loadFFmpeg = useCallback(async () => {
    if (isLoaded || isLoading) return
    
    setIsLoading(true)
    setProgress(0)
    
    try {
      const ffmpeg = new FFmpeg()
      ffmpegRef.current = ffmpeg
      
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/esm'
      
      ffmpeg.on('log', ({ message }) => {
        console.log(message)
      })
      
      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(Math.round(p * 100))
      })
      
      // toBlobURL is used to bypass CORS issue
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
      })
      
      setIsLoaded(true)
    } catch (error) {
      console.error('Failed to load FFmpeg:', error)
      throw error
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }, [isLoaded, isLoading])

  const createGIF = useCallback(async (images: Blob[], framerate = 2): Promise<Blob> => {
    // Auto-load FFmpeg if not already loaded
    if (!ffmpegRef.current || !isLoaded) {
      await loadFFmpeg()
    }
    
    if (images.length === 0) {
      throw new Error('No images provided')
    }
    
    const ffmpeg = ffmpegRef.current
    if (!ffmpeg) {
      throw new Error('FFmpeg failed to initialize')
    }
    
    setProgress(0)
    
    try {
      for (let i = 0; i < images.length; i++) {
        const filename = `frame_${i.toString().padStart(4, '0')}.jpg`
        await ffmpeg.writeFile(filename, await fetchFile(images[i]))
      }
      
      const outputFilename = 'output.gif'
      
      // Simple direct GIF creation
      await ffmpeg.exec([
        '-framerate', framerate.toString(),
        '-i', 'frame_%04d.jpg',
        '-vf', 'scale=320:-1:flags=lanczos',
        '-loop', '0',
        '-y',
        outputFilename
      ])
      
      const data = await ffmpeg.readFile(outputFilename)
      
      for (let i = 0; i < images.length; i++) {
        const filename = `frame_${i.toString().padStart(4, '0')}.jpg`
        try {
          await ffmpeg.deleteFile(filename)
        } catch (e) {
          console.warn(`Failed to delete ${filename}:`, e)
        }
      }
      
      try {
        await ffmpeg.deleteFile(outputFilename)
      } catch (e) {
        console.warn('Failed to cleanup files:', e)
      }
      
      const dataUint8 = data instanceof ArrayBuffer 
        ? new Uint8Array(data)
        : new Uint8Array(data as ArrayBuffer)
      return new Blob([dataUint8.buffer], { type: 'image/gif' })
    } catch (error) {
      console.error('Failed to create GIF:', error)
      throw error
    } finally {
      setProgress(0)
    }
  }, [isLoaded, loadFFmpeg])

  return {
    isLoaded,
    isLoading,
    loadFFmpeg,
    createGIF,
    progress
  }
}