import { useEffect, useState, useId } from 'react'
import type { Camera } from '../types/Camera'
import { useGeolocation } from '../hooks/useGeolocation'
import { Map, MapMarker, MarkerContent, MarkerPopup, MapPopup, MapControls, useMap } from '@/components/ui/map'
import { Button } from '@/components/ui/button'
import { RotateCcw, Mountain } from 'lucide-react'
import type MapLibreGL from 'maplibre-gl'

interface CameraMapViewProps {
  cameras: Camera[]
  onCameraSelect: (camera: Camera) => void
  selectedCamera?: Camera | null
  onStartPreview?: (camera: Camera) => void
  isLoading?: boolean
}

// NYC center coordinates (around Manhattan)
const NYC_CENTER: [number, number] = [-73.9851, 40.7589]

// Single marker color for all cameras
const MARKER_COLOR = '#3b82f6' // blue

// Convert cameras to GeoJSON format
function camerasToGeoJSON(cameras: Camera[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
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

// Camera markers layer component using GeoJSON for performance
function CameraMarkersLayer({
  cameras,
  onCameraSelect,
  selectedCamera
}: {
  cameras: Camera[]
  onCameraSelect: (camera: Camera) => void
  selectedCamera?: Camera | null
}) {
  const { map, isLoaded } = useMap()
  const id = useId()
  const sourceId = `cameras-source-${id}`
  const layerId = `cameras-layer-${id}`
  const [localSelectedCamera, setLocalSelectedCamera] = useState<Camera | null>(null)

  // Update local selected camera when prop changes
  useEffect(() => {
    setLocalSelectedCamera(selectedCamera || null)
  }, [selectedCamera])

  // Add GeoJSON source and layer
  useEffect(() => {
    if (!map || !isLoaded) return

    const geoJSONData = camerasToGeoJSON(cameras)

    map.addSource(sourceId, {
      type: 'geojson',
      data: geoJSONData,
    })

    map.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': [
          'case',
          ['==', ['get', 'id'], selectedCamera?.id || ''],
          8, // larger for selected
          6  // normal size
        ],
        'circle-color': MARKER_COLOR,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 1,
      },
    })

    const handleClick = (
      e: MapLibreGL.MapMouseEvent & {
        features?: MapLibreGL.MapGeoJSONFeature[]
      }
    ) => {
      if (!e.features?.length) return

      const feature = e.features[0]
      const cameraId = feature.properties?.id
      const camera = cameras.find(c => c.id === cameraId)

      if (camera) {
        onCameraSelect(camera)
        setLocalSelectedCamera(camera)
      }
    }

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('click', layerId, handleClick)
    map.on('mouseenter', layerId, handleMouseEnter)
    map.on('mouseleave', layerId, handleMouseLeave)

    return () => {
      map.off('click', layerId, handleClick)
      map.off('mouseenter', layerId, handleMouseEnter)
      map.off('mouseleave', layerId, handleMouseLeave)

      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch {
        // ignore cleanup errors
      }
    }
  }, [map, isLoaded, sourceId, layerId, cameras, onCameraSelect, selectedCamera])

  // Update layer when selected camera changes
  useEffect(() => {
    if (!map || !isLoaded || !map.getLayer(layerId)) return

    map.setPaintProperty(layerId, 'circle-radius', [
      'case',
      ['==', ['get', 'id'], selectedCamera?.id || ''],
      8,
      6
    ])
  }, [map, isLoaded, layerId, selectedCamera])

  return null
}

// Map controller for centering on user location
function MapCenterController({ userLocation }: { userLocation: { latitude: number, longitude: number } | null }) {
  const { map } = useMap()

  useEffect(() => {
    if (userLocation && map) {
      map.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 13,
        duration: 1000
      })
    }
  }, [map, userLocation])

  return null
}

// Map pitch and bearing controls (must be inside Map component)
function MapPitchBearingControls() {
  const { map, isLoaded } = useMap()
  const [pitch, setPitch] = useState(0)
  const [bearing, setBearing] = useState(0)

  useEffect(() => {
    if (!map || !isLoaded) return

    const handleMove = () => {
      setPitch(Math.round(map.getPitch()))
      setBearing(Math.round(map.getBearing()))
    }

    map.on('move', handleMove)
    return () => {
      map.off('move', handleMove)
    }
  }, [map, isLoaded])

  const handle3DView = () => {
    map?.easeTo({
      pitch: 60,
      bearing: -20,
      duration: 1000,
    })
  }

  const handleReset = () => {
    map?.easeTo({
      pitch: 0,
      bearing: 0,
      duration: 1000,
    })
  }

  if (!isLoaded) return null

  return (
    <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={handle3DView}>
          <Mountain className="size-4 mr-1.5" />
          3D View
        </Button>
        <Button size="sm" variant="secondary" onClick={handleReset}>
          <RotateCcw className="size-4 mr-1.5" />
          Reset
        </Button>
      </div>
      <div className="rounded-md bg-background/90 backdrop-blur px-3 py-2 text-xs font-mono border">
        <div>Pitch: {pitch}°</div>
        <div>Bearing: {bearing}°</div>
      </div>
    </div>
  )
}

export function CameraMapView({ cameras, onCameraSelect, selectedCamera, onStartPreview, isLoading }: CameraMapViewProps) {
  const { latitude, longitude, error, loading, getCurrentPosition, clearError } = useGeolocation()
  const [internalSelectedCamera, setInternalSelectedCamera] = useState<Camera | null>(null)

  // Keep track of which camera is selected (either from prop or internal)
  const activeSelectedCamera = selectedCamera !== undefined ? selectedCamera : internalSelectedCamera

  const handleCameraSelect = (camera: Camera) => {
    setInternalSelectedCamera(camera)
    onCameraSelect(camera)
  }

  const handleClosePopup = () => {
    setInternalSelectedCamera(null)
    // If parent is controlling selection, notify them
    if (selectedCamera !== undefined) {
      onCameraSelect(null as unknown as Camera) // This might need adjustment based on parent component expectations
    }
  }

  const userLocation = latitude && longitude ? { latitude, longitude } : null

  return (
    <div className="h-full w-full relative">
      {/* Custom locate button that uses our geolocation hook */}
      <button
        onClick={getCurrentPosition}
        disabled={loading}
        className="absolute top-4 right-4 z-[1000] bg-white hover:bg-gray-50 disabled:bg-gray-100 shadow-lg rounded-lg p-3 transition-colors border border-gray-200"
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
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-lg shadow-lg max-w-sm">
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

      <Map center={NYC_CENTER} zoom={11}>
        <MapCenterController userLocation={userLocation} />
        <MapPitchBearingControls />

        {/* Camera markers layer */}
        <CameraMarkersLayer
          cameras={cameras}
          onCameraSelect={handleCameraSelect}
          selectedCamera={activeSelectedCamera}
        />

        {/* User location marker */}
        {userLocation && (
          <MapMarker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
          >
            <MarkerContent>
              <div className="relative h-5 w-5 rounded-full border-3 border-white bg-blue-500 shadow-lg">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full" />
              </div>
            </MarkerContent>
            <MarkerPopup>
              <div className="text-sm">
                <h3 className="font-medium text-blue-600 mb-1">Your Location</h3>
                <p className="text-gray-600 text-xs">
                  {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                </p>
              </div>
            </MarkerPopup>
          </MapMarker>
        )}

        {/* Selected camera popup */}
        {activeSelectedCamera && (
          <MapPopup
            longitude={activeSelectedCamera.longitude}
            latitude={activeSelectedCamera.latitude}
            onClose={handleClosePopup}
            closeButton={false}
          >
            <div className="text-sm min-w-[200px]">
              <h3 className="font-medium text-gray-900 mb-1">
                {activeSelectedCamera.name}
              </h3>
              <p className="text-gray-600 text-xs mb-3">{activeSelectedCamera.area}</p>
              {onStartPreview && activeSelectedCamera.isOnline && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onStartPreview(activeSelectedCamera)
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
          </MapPopup>
        )}

        {/* Map controls - only show zoom, not locate (we have custom locate button) */}
        <MapControls
          position="bottom-right"
          showZoom={true}
          showLocate={false}
        />
      </Map>
    </div>
  )
}
