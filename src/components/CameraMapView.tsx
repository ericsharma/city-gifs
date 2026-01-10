import { useEffect, useState, useId, useMemo } from 'react'
import type { Camera } from '../types/Camera'
import { Map, MapMarker, MarkerContent, MarkerPopup, MapPopup, MapControls, useMap } from '@/components/ui/map'
import { Button } from '@/components/ui/button'
import { Mountain, Layers, X, Play, HelpCircle } from 'lucide-react'
import type MapLibreGL from 'maplibre-gl'
import { boroughBoundaries } from '../data/boroughsGeoJSON'
import { driver } from "driver.js"
import "driver.js/dist/driver.css"

interface CameraMapViewProps {
  cameras: Camera[]
  onCameraSelect: (camera: Camera) => void
  selectedCamera?: Camera | null
  onStartPreview?: (camera: Camera) => void
  isLoading?: boolean
}

// NYC center coordinates (around Manhattan)
const NYC_CENTER: [number, number] = [-73.9851, 40.7589]
const MARKER_COLOR = '#3b82f6'

const BOROUGH_COLORS = {
  'Manhattan': '#ef4444',
  'Brooklyn': '#3b82f6',
  'Queens': '#22c55e',
  'Bronx': '#f59e0b',
  'Staten Island': '#8b5cf6',
} as const

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

// Component to handle map side effects (FlyTo, EaseTo)
function MapEffects({ 
    userLocation, 
    is3DMode 
}: { 
    userLocation: { latitude: number, longitude: number } | null,
    is3DMode: boolean
}) {
    const { map } = useMap()

    useEffect(() => {
        if (userLocation && map) {
            map.flyTo({ center: [userLocation.longitude, userLocation.latitude], zoom: 13, duration: 1000 })
        }
    }, [map, userLocation])

    useEffect(() => {
        if (!map) return
        if (is3DMode) {
            map.easeTo({ pitch: 60, bearing: -20, duration: 1000 })
        } else {
            map.easeTo({ pitch: 0, bearing: 0, duration: 1000 })
        }
    }, [map, is3DMode])

    return null
}

// Camera markers layer component
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

  const geoJSONData = useMemo(() => camerasToGeoJSON(cameras), [cameras])

  useEffect(() => {
    if (!map || !isLoaded) return

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { type: 'geojson', data: geoJSONData })
    } else {
      (map.getSource(sourceId) as MapLibreGL.GeoJSONSource).setData(geoJSONData)
    }

    if (!map.getLayer(layerId)) {
        map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
            'circle-radius': [
            'case',
            ['==', ['get', 'id'], selectedCamera?.id || ''],
            8,
            6
            ],
            'circle-color': MARKER_COLOR,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 1,
        },
        })
    }

    const handleClick = (e: MapLibreGL.MapMouseEvent & { features?: MapLibreGL.MapGeoJSONFeature[] }) => {
      if (!e.features?.length) return
      const feature = e.features[0]
      const camera = cameras.find(c => c.id === feature.properties?.id)
      if (camera) onCameraSelect(camera)
    }

    const handleMouseEnter = () => { map.getCanvas().style.cursor = 'pointer' }
    const handleMouseLeave = () => { map.getCanvas().style.cursor = '' }

    map.on('click', layerId, handleClick)
    map.on('mouseenter', layerId, handleMouseEnter)
    map.on('mouseleave', layerId, handleMouseLeave)

    return () => {
      map.off('click', layerId, handleClick)
      map.off('mouseenter', layerId, handleMouseEnter)
      map.off('mouseleave', layerId, handleMouseLeave)
      if (map.getLayer(layerId)) map.removeLayer(layerId)
      if (map.getSource(sourceId)) map.removeSource(sourceId)
    }
  }, [map, isLoaded, sourceId, layerId, geoJSONData, cameras, onCameraSelect, selectedCamera])

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

// Borough boundaries layer with fill and outline styles
function BoroughBoundariesLayer({ 
    visibleBoroughs, 
    isVisible 
}: { 
    visibleBoroughs: string[], 
    isVisible: boolean 
}) {
  const { map, isLoaded } = useMap()
  const [hoveredBorough, setHoveredBorough] = useState<string | null>(null)

  useEffect(() => {
    if (!map || !isLoaded) return

    if (!map.getSource('boroughs')) {
      map.addSource('boroughs', { type: 'geojson', data: boroughBoundaries })
    }

    const layers = [
        { id: 'boroughs-fill', type: 'fill' as const, paint: {
            'fill-color': [
                'match',
                ['get', 'BoroName'],
                'Manhattan', BOROUGH_COLORS.Manhattan,
                'Brooklyn', BOROUGH_COLORS.Brooklyn,
                'Queens', BOROUGH_COLORS.Queens,
                'Bronx', BOROUGH_COLORS.Bronx,
                'Staten Island', BOROUGH_COLORS['Staten Island'],
                '#6b7280'
            ],
            'fill-opacity': 0.2,
        }},
        { id: 'boroughs-outline', type: 'line' as const, paint: {
            'line-color': [
                'match',
                ['get', 'BoroName'],
                'Manhattan', BOROUGH_COLORS.Manhattan,
                'Brooklyn', BOROUGH_COLORS.Brooklyn,
                'Queens', BOROUGH_COLORS.Queens,
                'Bronx', BOROUGH_COLORS.Bronx,
                'Staten Island', BOROUGH_COLORS['Staten Island'],
                '#6b7280'
            ],
            'line-width': 2,
            'line-opacity': 0.8,
        }}
    ]

    layers.forEach(layer => {
        if (!map.getLayer(layer.id)) {
            map.addLayer({
                id: layer.id,
                type: layer.type,
                source: 'boroughs',
                paint: layer.paint,
                layout: { visibility: isVisible ? 'visible' : 'none' }
            })
        }
    })

    const handleMouseEnter = () => { map.getCanvas().style.cursor = 'pointer' }
    const handleMouseLeave = () => { 
        map.getCanvas().style.cursor = ''
        setHoveredBorough(null)
    }
    const handleMouseMove = (e: MapLibreGL.MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['boroughs-fill'] })
        setHoveredBorough(features[0]?.properties?.BoroName || null)
    }

    map.on('mouseenter', 'boroughs-fill', handleMouseEnter)
    map.on('mouseleave', 'boroughs-fill', handleMouseLeave)
    map.on('mousemove', 'boroughs-fill', handleMouseMove)

    return () => {
        map.off('mouseenter', 'boroughs-fill', handleMouseEnter)
        map.off('mouseleave', 'boroughs-fill', handleMouseLeave)
        map.off('mousemove', 'boroughs-fill', handleMouseMove)
    }
  }, [map, isLoaded, isVisible])

  useEffect(() => {
      if (!map || !isLoaded) return
      const visibility = isVisible ? 'visible' : 'none'
      if (map.getLayer('boroughs-fill')) map.setLayoutProperty('boroughs-fill', 'visibility', visibility)
      if (map.getLayer('boroughs-outline')) map.setLayoutProperty('boroughs-outline', 'visibility', visibility)
  }, [map, isLoaded, isVisible])

  useEffect(() => {
    if (!map || !isLoaded) return
    const filter: any = ['in', ['get', 'BoroName'], ['literal', visibleBoroughs]]
    if (map.getLayer('boroughs-fill')) map.setFilter('boroughs-fill', filter)
    if (map.getLayer('boroughs-outline')) map.setFilter('boroughs-outline', filter)
  }, [map, isLoaded, visibleBoroughs])

  if (!isLoaded || !isVisible) return null

  return (
    <>
      {hoveredBorough && (
        <div className="absolute bottom-4 left-4 z-[1000] rounded-md bg-background/90 backdrop-blur px-3 py-2 text-sm font-medium border shadow-sm">
          {hoveredBorough}
        </div>
      )}
    </>
  )
}

function MapOverlayControls({
  visibleBoroughs,
  onToggleBorough,
  is3DMode,
  onToggle3DMode,
  isBoroughLayerVisible,
  onToggleBoroughLayer,
  onStartTour
}: {
  visibleBoroughs: string[]
  onToggleBorough: (borough: string) => void
  is3DMode: boolean
  onToggle3DMode: () => void
  isBoroughLayerVisible: boolean
  onToggleBoroughLayer: () => void
  onStartTour: () => void
}) {
  return (
    <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
        <Button
          id="tour-3d-toggle"
          size="sm"
          variant={is3DMode ? "default" : "secondary"}
          onClick={onToggle3DMode}
          className="shadow-sm"
        >
          <Mountain className="size-4 mr-1.5" />
          3D View
        </Button>
        <Button
          id="tour-borough-toggle"
          size="sm"
          variant={isBoroughLayerVisible ? "default" : "secondary"}
          onClick={onToggleBoroughLayer}
          className="shadow-sm"
        >
          {isBoroughLayerVisible ? <X className="size-4 mr-1.5" /> : <Layers className="size-4 mr-1.5" />}
          {isBoroughLayerVisible ? 'Hide' : 'Show'} Boroughs
        </Button>
        <Button
            id="tour-help-btn"
            size="sm"
            variant="secondary"
            onClick={onStartTour}
            className="shadow-sm"
        >
            <HelpCircle className="size-4 mr-1.5" />
            Tour
        </Button>
      </div>
      {isBoroughLayerVisible && (
        <div id="tour-borough-list" className="rounded-md bg-background/90 backdrop-blur px-3 py-2 text-xs font-mono border shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(BOROUGH_COLORS).map(([borough, color]) => {
              const isVisible = visibleBoroughs.includes(borough)
              return (
                <div
                  key={borough}
                  className={`flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity ${!isVisible ? 'opacity-40' : ''}`}
                  onClick={() => onToggleBorough(borough)}
                >
                  <div
                    className="size-3 rounded-full border border-black/10"
                    style={{ backgroundColor: color }}
                  />
                  <span>{borough}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function CameraMapView({ cameras, onCameraSelect, selectedCamera, onStartPreview, isLoading }: CameraMapViewProps) {
  const [internalSelectedCamera, setInternalSelectedCamera] = useState<Camera | null>(null)
  const [visibleBoroughs, setVisibleBoroughs] = useState<string[]>(Object.keys(BOROUGH_COLORS))
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null)
  const [is3DMode, setIs3DMode] = useState(false)
  const [isBoroughsVisible, setIsBoroughsVisible] = useState(false)

  const activeSelectedCamera = selectedCamera !== undefined ? selectedCamera : internalSelectedCamera

  const handleCameraSelect = (camera: Camera) => {
    setInternalSelectedCamera(camera)
    onCameraSelect(camera)
  }

  const filteredCameras = useMemo(() => 
    cameras.filter(camera => visibleBoroughs.includes(camera.area)),
  [cameras, visibleBoroughs])

  const toggleBorough = (borough: string) => {
    setVisibleBoroughs(prev => prev.includes(borough) ? prev.filter(b => b !== borough) : [...prev, borough])
  }

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      steps: [
        { 
          element: '#tour-3d-toggle', 
          popover: { title: '3D View', description: 'Toggle 3D view to explore NYC in three dimensions.', side: "right", align: 'start' },
          onHighlightStarted: () => setIs3DMode(true),
          onDeselected: () => setIs3DMode(false)
        },
        { 
          element: '#tour-borough-toggle', 
          popover: { title: 'Borough Filters', description: 'Show or hide boroughs to filter the camera feed map.', side: "bottom", align: 'start' },
          onHighlightStarted: () => setIsBoroughsVisible(true),
        },
        {
          element: '#tour-borough-list',
          popover: { title: 'Interactive Legend', description: 'Click items in the legend to toggle individual boroughs on and off. Watch as we focus on Manhattan.', side: "right", align: 'start' },
          onHighlightStarted: () => {
            const boroughsToRemove = ['Brooklyn', 'Queens', 'Bronx', 'Staten Island']
            boroughsToRemove.forEach((borough, index) => {
              setTimeout(() => {
                setVisibleBoroughs(prev => prev.filter(b => b !== borough))
              }, (index + 1) * 600)
            })
          },
          onDeselected: () => {
             setVisibleBoroughs(Object.keys(BOROUGH_COLORS))
          }
        },
        {
            element: '#tour-search-wrapper',
            popover: { title: 'Search Cameras', description: 'Find cameras quickly by name or location.', side: "left", align: 'start' },
            onHighlightStarted: () => {
                const toggleBtn = document.getElementById('tour-search-toggle');
                if (toggleBtn) toggleBtn.click();
                
                setTimeout(() => {
                    const input = document.getElementById('tour-search-input') as HTMLInputElement;
                    if (input) {
                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                        if (nativeInputValueSetter) {
                            nativeInputValueSetter.call(input, 'Central');
                            const ev = new Event('input', { bubbles: true});
                            input.dispatchEvent(ev);
                        }
                    }
                }, 500);
            },
            onDeselected: () => {
                const input = document.getElementById('tour-search-input') as HTMLInputElement;
                if (input) {
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                    if (nativeInputValueSetter) {
                        nativeInputValueSetter.call(input, '');
                        const ev = new Event('input', { bubbles: true});
                        input.dispatchEvent(ev);
                    }
                    // Find and click the close button (next sibling of input)
                    const closeBtn = input.nextElementSibling as HTMLElement;
                    if (closeBtn) closeBtn.click();
                }
            }
        },
        { element: '#tour-map-controls', popover: { title: 'Map Controls', description: 'Find your location, Reset map orientation, and Zoom in/out.', side: "left", align: 'start' } },
        { element: '#tour-help-btn', popover: { title: 'Help & Tour', description: 'Click here anytime to replay this walkthrough.', side: "bottom", align: 'end' } },
      ]
    });
    driverObj.drive();
  }

  return (
    <div id="camera-map-view-container" className="h-full w-full relative">
      <Map center={NYC_CENTER} zoom={11}>
        <MapEffects 
            userLocation={userLocation}
            is3DMode={is3DMode}
        />
        
        <MapOverlayControls
          visibleBoroughs={visibleBoroughs}
          onToggleBorough={toggleBorough}
          is3DMode={is3DMode}
          onToggle3DMode={() => setIs3DMode(!is3DMode)}
          isBoroughLayerVisible={isBoroughsVisible}
          onToggleBoroughLayer={() => setIsBoroughsVisible(!isBoroughsVisible)}
          onStartTour={startTour}
        />
        
        <BoroughBoundariesLayer 
            visibleBoroughs={visibleBoroughs} 
            isVisible={isBoroughsVisible}
        />

        <CameraMarkersLayer
          cameras={filteredCameras}
          onCameraSelect={handleCameraSelect}
          selectedCamera={activeSelectedCamera}
        />

        {userLocation && (
          <MapMarker longitude={userLocation.longitude} latitude={userLocation.latitude}>
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

        {activeSelectedCamera && (
          <MapPopup
            longitude={activeSelectedCamera.longitude}
            latitude={activeSelectedCamera.latitude}
            onClose={() => {
                setInternalSelectedCamera(null)
                if (selectedCamera !== undefined) onCameraSelect(null as unknown as Camera)
            }}
            closeButton={false}
          >
            <div className="text-sm min-w-[200px]">
              <h3 className="font-medium text-gray-900 mb-1">{activeSelectedCamera.name}</h3>
              <p className="text-gray-600 text-xs mb-3">{activeSelectedCamera.area}</p>
              {onStartPreview && activeSelectedCamera.isOnline && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    onStartPreview(activeSelectedCamera)
                  }}
                  disabled={isLoading}
                  size="sm"
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Play className="size-4 mr-2" />
                      Start Live Preview
                    </>
                  )}
                </Button>
              )}
            </div>
          </MapPopup>
        )}

        <MapControls
          id="tour-map-controls"
          position="bottom-right"
          showZoom
          showLocate
          showCompass
          onLocate={setUserLocation}
          onCompassClick={() => setIs3DMode(false)}
        />
      </Map>
    </div>
  )
}