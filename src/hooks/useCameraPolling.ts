import { useQuery } from '@tanstack/react-query'

interface UseCameraPollingOptions {
  cameraId: string
  imageUrl: string
  pollingInterval: number
  enabled?: boolean
}

interface CameraImage {
  url: string
  timestamp: number
  blob: Blob
}

export const useCameraPolling = ({
  cameraId,
  imageUrl,
  pollingInterval,
  enabled = true
}: UseCameraPollingOptions) => {
  return useQuery<CameraImage>({
    queryKey: ['camera-image', cameraId, imageUrl],
    queryFn: async (): Promise<CameraImage> => {
      // Convert the external URL to use our local proxy
      const proxyUrl = imageUrl.replace('https://webcams.nyctmc.org', '')
      
      // Add timestamp to prevent caching
      const urlWithTimestamp = `${proxyUrl}?t=${Date.now()}`
      
      try {
        const response = await fetch(urlWithTimestamp, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch camera image: ${response.status} ${response.statusText}`)
        }
        
        const blob = await response.blob()
        
        // Verify the blob is actually an image
        if (!blob.type.startsWith('image/')) {
          throw new Error('Response is not an image')
        }
        
        const url = URL.createObjectURL(blob)
        const timestamp = Date.now()
        
        return {
          url,
          timestamp,
          blob
        }
      } catch (error) {
        console.error('Camera image fetch error:', error)
        throw new Error(`Camera feed unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },
    refetchInterval: pollingInterval,
    enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchIntervalInBackground: true,
    networkMode: 'always',
    retry: (failureCount, error) => {
      // Retry network errors but not image format errors
      if (error.message.includes('not an image')) {
        return false
      }
      return failureCount < 2
    },
    retryDelay: 2000
  })
}