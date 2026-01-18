// Map configuration constants

// NYC center coordinates (around Manhattan)
export const NYC_CENTER: [number, number] = [-73.9851, 40.7589]

// Marker color for cameras
export const MARKER_COLOR = '#3b82f6'

// NYC bounds for coordinate validation
export const NYC_BOUNDS = {
  minLng: -74.3,
  maxLng: -73.7,
  minLat: 40.5,
  maxLat: 40.95
} as const

// Borough colors for map visualization
export const BOROUGH_COLORS = {
  Manhattan: '#ef4444',
  Brooklyn: '#3b82f6',
  Queens: '#22c55e',
  Bronx: '#f59e0b',
  'Staten Island': '#8b5cf6',
} as const

export type BoroughName = keyof typeof BOROUGH_COLORS
