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
