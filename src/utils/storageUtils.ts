import { BOROUGH_COLORS, NYC_CENTER } from '../constants/mapConfig'
import { isValidCoordinates } from './mapUtils'

// Map state persistence interface
export interface SavedMapState {
  center: { lng: number; lat: number }
  zoom: number
  bearing: number
  pitch: number
  is3DMode: boolean
  isBoroughsVisible: boolean
  visibleBoroughs: string[]
}

// Type guard for SavedMapState
export function isValidSavedMapState(obj: unknown): obj is SavedMapState {
  if (!obj || typeof obj !== 'object') return false
  const state = obj as Record<string, unknown>

  return (
    typeof state.center === 'object' &&
    state.center !== null &&
    typeof (state.center as Record<string, unknown>).lng === 'number' &&
    typeof (state.center as Record<string, unknown>).lat === 'number' &&
    typeof state.zoom === 'number' &&
    typeof state.bearing === 'number' &&
    typeof state.pitch === 'number' &&
    typeof state.is3DMode === 'boolean' &&
    typeof state.isBoroughsVisible === 'boolean' &&
    Array.isArray(state.visibleBoroughs)
  )
}

// Get default map state
export function getDefaultMapState(initialZoom: number): SavedMapState {
  return {
    center: { lng: NYC_CENTER[0], lat: NYC_CENTER[1] },
    zoom: initialZoom,
    bearing: 0,
    pitch: 0,
    is3DMode: false,
    isBoroughsVisible: false,
    visibleBoroughs: Object.keys(BOROUGH_COLORS)
  }
}

// Load initial map state from localStorage
export function getInitialMapState(initialZoom: number): SavedMapState {
  // SSR compatibility guard
  if (typeof window === 'undefined') {
    return getDefaultMapState(initialZoom)
  }

  try {
    const saved = localStorage.getItem('city-gifs-map-state')
    if (saved) {
      const parsed = JSON.parse(saved)

      // Validate structure and coordinates
      if (
        isValidSavedMapState(parsed) &&
        isValidCoordinates(parsed.center.lng, parsed.center.lat)
      ) {
        return parsed
      }

      console.warn('Invalid saved map state structure or coordinates, using defaults')
    }
  } catch (e) {
    console.warn('Failed to load saved map state:', e)
  }

  return getDefaultMapState(initialZoom)
}

// Save map state to localStorage with error handling
export function saveMapStateToStorage(state: SavedMapState): void {
  try {
    localStorage.setItem('city-gifs-map-state', JSON.stringify(state))
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, clearing old state')
      try {
        localStorage.removeItem('city-gifs-map-state')
      } catch (clearError) {
        console.warn('Failed to clear localStorage:', clearError)
      }
    } else {
      console.warn('Failed to save map state:', e)
    }
  }
}
