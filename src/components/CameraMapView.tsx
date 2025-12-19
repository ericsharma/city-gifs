import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { type LatLngExpression, Icon, DivIcon } from 'leaflet'
import type { Camera } from '../types/Camera'
import 'leaflet/dist/leaflet.css'

interface CameraMapViewProps {
  cameras: Camera[]
  onCameraSelect: (camera: Camera) => void
  selectedCamera?: Camera | null
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

export function CameraMapView({ cameras, onCameraSelect, selectedCamera }: CameraMapViewProps) {
  // Fix Leaflet default marker icons in React
  useEffect(() => {
    // Delete default icon to prevent console errors
    delete (Icon.Default.prototype as any)._getIconUrl
  }, [])

  // Filter to only online cameras for cleaner map
  const onlineCameras = cameras.filter(camera => camera.isOnline)

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={NYC_CENTER}
        zoom={11}
        scrollWheelZoom={true}
        className="h-full w-full"
        zoomControl={true}
      >
        {/* Map tiles - Proxied through Vite to handle COEP */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="/tiles/{z}/{x}/{y}.png"
        />
        
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
              <div className="text-sm">
                <h3 className="font-medium text-gray-900 mb-1">
                  {camera.name}
                </h3>
                <p className="text-gray-600 mb-2">{camera.area}</p>
                <div className="flex items-center gap-2">
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
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
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