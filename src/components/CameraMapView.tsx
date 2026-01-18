import { useEffect, useState, useId, useMemo, useCallback, useRef } from 'react'
import type { Camera } from '../types/Camera'
import { Map, MapMarker, MarkerContent, MarkerPopup, MapPopup, MapControls, useMap } from '@/components/ui/map'
import { Button } from '@/components/ui/button'
import { Mountain, Layers, X, HelpCircle } from 'lucide-react'
import type MapLibreGL from 'maplibre-gl'
import { boroughBoundaries } from '../data/boroughsGeoJSON'
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { toast } from 'sonner'
import { MARKER_COLOR, BOROUGH_COLORS } from '../constants/mapConfig'
import { camerasToGeoJSON, createBoroughColorExpression, createCameraRadiusExpression, generateShareURL, copyToClipboard, parseShareURL } from '../utils/mapUtils'
import { getInitialMapState, saveMapStateToStorage, type SavedMapState } from '../utils/storageUtils'
import { setInputValue, setCursor } from '../utils/domUtils'
import { CameraPopupCard } from './map/CameraPopupCard'

interface CameraMapViewProps {
  cameras: Camera[]
  onCameraSelect: (camera: Camera) => void
  selectedCamera?: Camera | null
  onStartPreview?: (camera: Camera) => void
  isLoading?: boolean
}

// All constants and utility functions moved to external modules

// Component to capture map instance reference
function MapInstanceCapture({ mapRef }: { mapRef: React.MutableRefObject<MapLibreGL.Map | null> }) {
  const { map } = useMap()

  useEffect(() => {
    if (map) {
      mapRef.current = map
    }
  }, [map, mapRef])

  return null
}

// Component to handle map side effects (FlyTo, EaseTo)
function MapEffects({
    userLocation,
    is3DMode,
    shouldPersistRef
}: {
    userLocation: { latitude: number, longitude: number } | null,
    is3DMode: boolean,
    shouldPersistRef: React.MutableRefObject<boolean>
}) {
    const { map } = useMap()

    useEffect(() => {
        if (userLocation && map) {
            // Temporarily disable persistence when flying to user location
            shouldPersistRef.current = false
            map.flyTo({ center: [userLocation.longitude, userLocation.latitude], zoom: 13, duration: 1000 })
            // Re-enable persistence after animation completes
            setTimeout(() => {
                shouldPersistRef.current = true
            }, 1100)
        }
    }, [map, userLocation, shouldPersistRef])

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
            // @ts-expect-error - MapLibre GL expression types are overly strict, but this is a valid expression
            'circle-radius': createCameraRadiusExpression(selectedCamera?.id),
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

    const handleMouseEnter = () => { setCursor(map, 'pointer') }
    const handleMouseLeave = () => { setCursor(map, '') }

    map.on('click', layerId, handleClick)
    map.on('mouseenter', layerId, handleMouseEnter)
    map.on('mouseleave', layerId, handleMouseLeave)

    return () => {
      if (!map) return
      try {
        map.off('click', layerId, handleClick)
        map.off('mouseenter', layerId, handleMouseEnter)
        map.off('mouseleave', layerId, handleMouseLeave)
        if (map.getLayer(layerId)) map.removeLayer(layerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch (e) {
        // If a camera is selected, suppress cleanup errors (common during transitions)
        // Otherwise rethrow to expose potential bugs
        if (!selectedCamera) {
            console.error('Map cleanup error:', e)
            throw e
        }
      }
    }
  }, [map, isLoaded, sourceId, layerId, geoJSONData, cameras, onCameraSelect, selectedCamera])

  useEffect(() => {
    if (!map || !isLoaded || !map.getLayer(layerId)) return
    map.setPaintProperty(
      layerId,
      'circle-radius',
      createCameraRadiusExpression(selectedCamera?.id)
    )
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

    const colorExpression = createBoroughColorExpression()

    const layers = [
        { id: 'boroughs-fill', type: 'fill' as const, paint: {
            'fill-color': colorExpression,
            'fill-opacity': 0.2,
        }},
        { id: 'boroughs-outline', type: 'line' as const, paint: {
            'line-color': colorExpression,
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
            } as MapLibreGL.AddLayerObject)
        }
    })

    const handleMouseEnter = () => { setCursor(map, 'pointer') }
    const handleMouseLeave = () => {
        setCursor(map, '')
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

// Component to persist map state to localStorage
function MapStatePersistence({
  is3DMode,
  isBoroughsVisible,
  visibleBoroughs,
  shouldPersist
}: {
  is3DMode: boolean
  isBoroughsVisible: boolean
  visibleBoroughs: string[]
  shouldPersist: boolean
}) {
  const { map, isLoaded } = useMap()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Shared save function
  const saveMapState = useCallback(() => {
    if (!map || !isLoaded || !shouldPersist) return

    const center = map.getCenter()
    const state: SavedMapState = {
      center: { lng: center.lng, lat: center.lat },
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
      is3DMode,
      isBoroughsVisible,
      visibleBoroughs
    }
    saveMapStateToStorage(state)
  }, [map, isLoaded, is3DMode, isBoroughsVisible, visibleBoroughs, shouldPersist])

  // Debounced save for map movements
  useEffect(() => {
    if (!map || !isLoaded) return

    const debouncedSave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(saveMapState, 500)
    }

    map.on('moveend', debouncedSave)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      map.off('moveend', debouncedSave)
      // Final save on unmount
      saveMapState()
    }
  }, [map, isLoaded, saveMapState])

  // Immediate save when UI state changes
  useEffect(() => {
    saveMapState()
  }, [saveMapState])

  return null
}

export function CameraMapView({ cameras, onCameraSelect, selectedCamera, onStartPreview, isLoading }: CameraMapViewProps) {
  // Determine initial zoom level based on screen width
  const initialZoom = useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 10
    }
    return 11
  }, [])

  // Load saved map state from localStorage
  const savedState = useMemo(() => getInitialMapState(initialZoom), [initialZoom])

  const [internalSelectedCamera, setInternalSelectedCamera] = useState<Camera | null>(null)
  const [visibleBoroughs, setVisibleBoroughs] = useState<string[]>(savedState.visibleBoroughs)
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null)
  const [is3DMode, setIs3DMode] = useState(savedState.is3DMode)
  const [isBoroughsVisible, setIsBoroughsVisible] = useState(savedState.isBoroughsVisible)

  // Control whether map state should be persisted (false during user location flyTo)
  const shouldPersistRef = useRef(true)

  // Store map instance reference for share functionality
  const mapInstanceRef = useRef<MapLibreGL.Map | null>(null)

  // Track if we've already handled the shared URL to prevent re-processing
  const hasHandledSharedUrlRef = useRef(false)

  const activeSelectedCamera = selectedCamera !== undefined ? selectedCamera : internalSelectedCamera

  const handleCameraSelect = (camera: Camera) => {
    setInternalSelectedCamera(camera)
    onCameraSelect(camera)
  }

  const handleClosePopup = useCallback(() => {
    setInternalSelectedCamera(null)
    if (selectedCamera !== undefined) onCameraSelect(null as unknown as Camera)

    // Clear URL parameters to prevent re-opening the popup
    const url = new URL(window.location.href)
    url.searchParams.delete('camera')
    url.searchParams.delete('lng')
    url.searchParams.delete('lat')
    url.searchParams.delete('zoom')
    url.searchParams.delete('bearing')
    url.searchParams.delete('pitch')
    window.history.replaceState({}, '', url.toString())

    // Reset shared URL ref so future shared links will work
    hasHandledSharedUrlRef.current = false
  }, [selectedCamera, onCameraSelect])

  const handleShareCamera = useCallback(async (camera: Camera) => {
    if (!mapInstanceRef.current) {
      toast.error('Map not ready yet')
      return
    }

    const map = mapInstanceRef.current

    const shareURL = generateShareURL({
      cameraId: camera.id,
      center: { lng: camera.longitude, lat: camera.latitude },
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch()
    })

    const shareText = `Check out this live camera: ${camera.name} in ${camera.area} - NYC Camera GIFs`

    const shareData = {
      title: 'NYC Live Camera',
      text: shareText,
      url: shareURL
    }

    // Try native share API first (mobile PWA)
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData)
        toast.success('Camera shared successfully!')
        return
      } catch (error) {
        // User cancelled or share failed, fall through to clipboard
        if ((error as Error).name !== 'AbortError') {
          console.log('Share failed:', error)
        }
      }
    }

    // Fallback to clipboard for desktop or if native share unavailable
    const success = await copyToClipboard(shareURL)

    if (success) {
      toast.success('Camera link copied to clipboard!')
    } else {
      toast.error('Failed to copy link')
    }
  }, [])

  const filteredCameras = useMemo(() => 
    cameras.filter(camera => visibleBoroughs.includes(camera.area)),
  [cameras, visibleBoroughs])

  const toggleBorough = (borough: string) => {
    setVisibleBoroughs(prev => prev.includes(borough) ? prev.filter(b => b !== borough) : [...prev, borough])
  }

  const startTour = () => {
    let isBoroughAnimating = false;

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
          popover: { 
            title: 'Interactive Legend', 
            description: 'Click items in the legend to toggle individual boroughs on and off. Watch as we focus on Manhattan.', 
            side: "right", 
            align: 'start',
            onNextClick: () => {
                if (isBoroughAnimating) return
                driverObj.moveNext()
            }
          },
          onHighlightStarted: () => {
            isBoroughAnimating = true
            const boroughsToRemove = ['Brooklyn', 'Queens', 'Bronx', 'Staten Island']
            
            // Disable Next button visually and functionally
            setTimeout(() => {
                const nextBtn = document.querySelector('.driver-popover-next-btn') as HTMLButtonElement
                if (nextBtn) {
                    nextBtn.disabled = true
                    // Add styling to match typical disabled state
                    nextBtn.style.pointerEvents = 'none'
                    nextBtn.style.opacity = '0.5'
                    nextBtn.style.cursor = 'not-allowed'
                }
            }, 0)

            boroughsToRemove.forEach((borough, index) => {
              setTimeout(() => {
                setVisibleBoroughs(prev => prev.filter(b => b !== borough))
                
                // Re-enable Next button after last animation
                if (index === boroughsToRemove.length - 1) {
                    isBoroughAnimating = false
                    const nextBtn = document.querySelector('.driver-popover-next-btn') as HTMLButtonElement
                    if (nextBtn) {
                        nextBtn.disabled = false
                        nextBtn.style.pointerEvents = ''
                        nextBtn.style.opacity = ''
                        nextBtn.style.cursor = ''
                    }
                }
              }, (index + 1) * 600)
            })
          },
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
                        setInputValue(input, 'Central');
                    }
                }, 500);
            },
            onDeselected: () => {
                const input = document.getElementById('tour-search-input') as HTMLInputElement;
                if (input) {
                    setInputValue(input, '');
                    // Find and click the close button (next sibling of input)
                    const closeBtn = input.nextElementSibling as HTMLElement;
                    if (closeBtn) closeBtn.click();
                }
            }
        },
        { element: '#tour-map-controls', popover: { title: 'Map Controls', description: 'Find your location, Reset map orientation, and Zoom in/out.', side: "left", align: 'start' } },
        { element: '#tour-theme-toggle', popover: { title: 'Theme Switcher', description: 'Toggle between light and dark mode.', side: "bottom", align: 'end' } },
        { element: '#tour-github-btn', popover: { title: 'Open Source', description: 'Check out the code on GitHub and give it a star if you like it!', side: "bottom", align: 'end' } },
      ]
    });
    driverObj.drive();
  }

  // Auto-start tour for new users
  useEffect(() => {
    const isNewUser = localStorage.getItem('city-gifs-new-user') !== 'false'
    if (isNewUser) {
        // Small delay to ensure map and UI are rendered
        const timer = setTimeout(() => {
            startTour()
            localStorage.setItem('city-gifs-new-user', 'false')
        }, 1500)
        return () => clearTimeout(timer)
    }
  }, [])

  // Handle shared camera URL on mount
  useEffect(() => {
    // Only process shared URL once
    if (hasHandledSharedUrlRef.current) return

    const sharedState = parseShareURL()
    if (!sharedState || !sharedState.cameraId) return

    // Find the camera by ID
    const camera = cameras.find(c => c.id === sharedState.cameraId)
    if (!camera) {
      console.warn('Shared camera not found:', sharedState.cameraId)
      return
    }

    // Mark as handled
    hasHandledSharedUrlRef.current = true

    // Select the camera
    handleCameraSelect(camera)

    // Apply shared map view if available
    if (mapInstanceRef.current && sharedState.center) {
      const map = mapInstanceRef.current

      // Small delay to ensure map is fully loaded
      setTimeout(() => {
        map.flyTo({
          center: [sharedState.center!.lng, sharedState.center!.lat],
          zoom: sharedState.zoom ?? map.getZoom(),
          bearing: sharedState.bearing ?? map.getBearing(),
          pitch: sharedState.pitch ?? map.getPitch(),
          duration: 1500
        })
      }, 500)
    }
  }, [cameras]) // Run when cameras are loaded

  return (
    <div id="camera-map-view-container" className="h-full w-full relative">
      <Map
        center={[savedState.center.lng, savedState.center.lat]}
        zoom={savedState.zoom}
        bearing={savedState.bearing}
        pitch={savedState.pitch}
      >
        <MapInstanceCapture mapRef={mapInstanceRef} />

        <MapEffects
            userLocation={userLocation}
            is3DMode={is3DMode}
            shouldPersistRef={shouldPersistRef}
        />

        <MapStatePersistence
          is3DMode={is3DMode}
          isBoroughsVisible={isBoroughsVisible}
          visibleBoroughs={visibleBoroughs}
          shouldPersist={shouldPersistRef.current}
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
            onClose={handleClosePopup}
            closeButton={false}
          >
            <CameraPopupCard
              camera={activeSelectedCamera}
              isLoading={isLoading}
              onClose={handleClosePopup}
              onStartPreview={onStartPreview}
              onShare={handleShareCamera}
            />
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