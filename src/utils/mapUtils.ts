import type { Camera } from '../types/Camera'
import { BOROUGH_COLORS, NYC_BOUNDS } from '../constants/mapConfig'

// Convert cameras to GeoJSON format
export function camerasToGeoJSON(cameras: Camera[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: cameras
      .filter(c => c.isOnline)
      .map(camera => ({
        type: 'Feature' as const,
        properties: {
          id: camera.id,
          name: camera.name,
          area: camera.area,
          isOnline: camera.isOnline,
          imageUrl: camera.imageUrl,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [camera.longitude, camera.latitude],
        },
      })),
  }
}

// Create borough color expression for MapLibre GL
export function createBoroughColorExpression(): any[] {
  return [
    'match',
    ['get', 'BoroName'],
    ...Object.entries(BOROUGH_COLORS).flat(),
    '#6b7280' // Default color
  ]
}

// Create circle radius expression for selected camera
// Returns a MapLibre GL expression for conditional circle radius
export function createCameraRadiusExpression(selectedCameraId?: string) {
  return [
    'case',
    ['==', ['get', 'id'], selectedCameraId || ''],
    8,  // Selected size
    6   // Default size
  ]
}

// Validate coordinates are within NYC bounds
export function isValidCoordinates(lng: number, lat: number): boolean {
  return (
    lng >= NYC_BOUNDS.minLng &&
    lng <= NYC_BOUNDS.maxLng &&
    lat >= NYC_BOUNDS.minLat &&
    lat <= NYC_BOUNDS.maxLat &&
    !isNaN(lng) &&
    !isNaN(lat) &&
    isFinite(lng) &&
    isFinite(lat)
  )
}

// Map state for sharing
export interface ShareableMapState {
  cameraId: string
  center: { lng: number; lat: number }
  zoom: number
  bearing: number
  pitch: number
}

// Generate shareable URL with camera and map state
export function generateShareURL(state: ShareableMapState): string {
  const url = new URL(window.location.origin)
  url.searchParams.set('camera', state.cameraId)
  url.searchParams.set('lng', state.center.lng.toFixed(6))
  url.searchParams.set('lat', state.center.lat.toFixed(6))
  url.searchParams.set('zoom', state.zoom.toFixed(2))
  url.searchParams.set('bearing', state.bearing.toFixed(1))
  url.searchParams.set('pitch', state.pitch.toFixed(1))
  return url.toString()
}

// Parse URL parameters to extract shareable map state
export function parseShareURL(): Partial<ShareableMapState> | null {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  const cameraId = params.get('camera')

  if (!cameraId) return null

  const result: Partial<ShareableMapState> = { cameraId }

  // Parse map coordinates
  const lng = params.get('lng')
  const lat = params.get('lat')
  if (lng && lat) {
    const lngNum = parseFloat(lng)
    const latNum = parseFloat(lat)
    if (!isNaN(lngNum) && !isNaN(latNum)) {
      result.center = { lng: lngNum, lat: latNum }
    }
  }

  // Parse zoom
  const zoom = params.get('zoom')
  if (zoom) {
    const zoomNum = parseFloat(zoom)
    if (!isNaN(zoomNum)) {
      result.zoom = zoomNum
    }
  }

  // Parse bearing
  const bearing = params.get('bearing')
  if (bearing) {
    const bearingNum = parseFloat(bearing)
    if (!isNaN(bearingNum)) {
      result.bearing = bearingNum
    }
  }

  // Parse pitch
  const pitch = params.get('pitch')
  if (pitch) {
    const pitchNum = parseFloat(pitch)
    if (!isNaN(pitchNum)) {
      result.pitch = pitchNum
    }
  }

  return result
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (fallbackError) {
      console.error('Failed to copy to clipboard:', fallbackError)
      return false
    }
  }
}
