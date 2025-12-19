import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { type LatLngExpression, Icon, DivIcon } from 'leaflet'
import type { Camera } from '../types/Camera'
import { useGeolocation } from '../hooks/useGeolocation'
import 'leaflet/dist/leaflet.css'

interface CameraMapViewProps {
  cameras: Camera[]
  onCameraSelect: (camera: Camera) => void
  selectedCamera?: Camera | null
  onStartPreview?: (camera: Camera) => void
  isLoading?: boolean
}

// NYC center coordinates (around Manhattan)
const NYC_CENTER: LatLngExpression = [40.7589, -73.9851]

// Borough color mapping for visual distinction
const BOROUGH_COLORS = {
  'Manhattan': '#ef4444', // red
  'Brooklyn': '#3b82f6',  // blue
  'Queens': '#22c55e',    // green
  'Bronx': '#f59e0b',     // amber
  'Staten Island': '#8b5cf6', // violet
} as const

// Create custom markers for different boroughs and states
const createCameraMarker = (camera: Camera, isSelected: boolean) => {
  const color = BOROUGH_COLORS[camera.area as keyof typeof BOROUGH_COLORS] || '#6b7280'
  const size = isSelected ? 16 : 12
  const opacity = camera.isOnline ? 1 : 0.5
  
  return new DivIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        opacity: ${opacity};
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${isSelected ? 'transform: scale(1.2);' : ''}
        cursor: pointer;
      "></div>
    `,
    className: 'camera-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// Create user location marker
const createUserLocationMarker = () => {
  return new DivIcon({
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background-color: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    className: 'user-location-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

// Component to handle map updates
function MapController({ userLocation }: { userLocation: { latitude: number, longitude: number } | null }) {
  const map = useMap()
  
  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 13, {
        animate: true,
        duration: 1
      })
    }
  }, [map, userLocation])
  
  return null
}

export function CameraMapView({ cameras, onCameraSelect, selectedCamera, onStartPreview, isLoading }: CameraMapViewProps) {
  const { latitude, longitude, error, loading, getCurrentPosition, clearError } = useGeolocation()
  const [mapCenter, setMapCenter] = useState<LatLngExpression>(NYC_CENTER)
  
  // Fix Leaflet default marker icons in React
  useEffect(() => {
    // Delete default icon to prevent console errors
    delete (Icon.Default.prototype as any)._getIconUrl
  }, [])

  // Update map center when user location is found
  useEffect(() => {
    if (latitude && longitude) {
      setMapCenter([latitude, longitude])
    }
  }, [latitude, longitude])

  // Filter to only online cameras for cleaner map
  const onlineCameras = cameras.filter(camera => camera.isOnline)
  
  const userLocation = latitude && longitude ? { latitude, longitude } : null

  return (
    <div className="h-full w-full relative">
      {/* Locate button */}
      <button
        onClick={getCurrentPosition}
        disabled={loading}
        className="absolute top-4 right-4 z-1000 bg-white hover:bg-gray-50 disabled:bg-gray-100 shadow-lg rounded-lg p-3 transition-colors border border-gray-200"
        title="Find my location"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>

      {/* Error notification */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-1000 bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button onClick={clearError} className="ml-2 text-red-600 hover:text-red-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={11}
        scrollWheelZoom={true}
        className="h-full w-full"
        zoomControl={true}
      >
        <MapController userLocation={userLocation} />
        
        {/* Map tiles - Proxied through Vite to handle COEP */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="/tiles/{z}/{x}/{y}.png"
        />
        
        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={createUserLocationMarker()}
          >
            <Popup>
              <div className="text-sm">
                <h3 className="font-medium text-blue-600 mb-1">Your Location</h3>
                <p className="text-gray-600 text-xs">
                  {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Camera markers */}
        {onlineCameras.map((camera) => (
          <Marker
            key={camera.id}
            position={[camera.latitude, camera.longitude]}
            icon={createCameraMarker(camera, selectedCamera?.id === camera.id)}
            eventHandlers={{
              click: () => onCameraSelect(camera)
            }}
          >
            <Popup>
              <div className="text-sm min-w-[200px]">
                <h3 className="font-medium text-gray-900 mb-1">
                  {camera.name}
                </h3>
                <p className="text-gray-600 mb-2">{camera.area}</p>
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: BOROUGH_COLORS[camera.area as keyof typeof BOROUGH_COLORS] || '#6b7280' 
                    }}
                  />
                  <span className="text-xs text-gray-500">
                    {camera.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                {onStartPreview && camera.isOnline && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onStartPreview(camera)
                    }}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium py-2 px-3 rounded transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Start Live Preview
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-1000">
        <h4 className="text-sm font-medium mb-2">Boroughs</h4>
        <div className="space-y-1">
          {Object.entries(BOROUGH_COLORS).map(([borough, color]) => (
            <div key={borough} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-700">{borough}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}