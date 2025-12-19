import { useState } from 'react';
import type { Camera } from '../types/Camera';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { Search, MapPin, Camera as CameraIcon, ArrowRight, List, Map } from 'lucide-react';
import { CameraMapView } from './CameraMapView';

interface FullScreenCameraSelectorProps {
  cameras: Camera[];
  onCameraSelect: (camera: Camera) => void;
  isLoading?: boolean;
}

export function FullScreenCameraSelector({
  cameras,
  onCameraSelect,
  isLoading = false,
}: FullScreenCameraSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');

  const areas = Array.from(
    new Set(cameras.map((camera) => camera.area))
  ).sort();

  const filteredCameras = cameras.filter((camera) => {
    const matchesSearch = camera.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesArea = selectedArea === 'all' || camera.area === selectedArea;
    const isOnline = camera.isOnline;
    return matchesSearch && matchesArea && isOnline;
  });

  const handleCameraSelection = (camera: Camera) => {
    setSelectedCamera(camera);
  };

  const handleConfirmSelection = () => {
    if (selectedCamera) {
      onCameraSelect(selectedCamera);
    }
  };

  return (
    <div className='h-full bg-background flex flex-col scrollable'>
      {/* Header */}
      <div className='sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b'>
        <div className='p-4 sm:p-6'>
          <div className='text-center mb-6'>
            <h1 className='text-2xl sm:text-3xl font-bold tracking-tight mb-2'>
              NYC Camera GIFs
            </h1>
            <p className='text-muted-foreground text-sm sm:text-base'>
              Choose a live camera to start creating GIFs
            </p>
          </div>

          {/* Search and Filter */}
          <div className='space-y-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
              <Input
                placeholder='Search NYC cameras...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-9 text-base'
              />
            </div>

            <div className='flex gap-3'>
              <div className='flex-1'>
                <Select value={selectedArea} onValueChange={setSelectedArea}>
                  <SelectTrigger>
                    <SelectValue placeholder='Borough' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Boroughs</SelectItem>
                    {areas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Badge variant='secondary' className='px-3 py-2 text-sm'>
                {filteredCameras.length} available
              </Badge>
            </div>
            
            {/* View Toggle */}
            <div className='flex gap-1 bg-muted p-1 rounded-lg'>
                            <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setViewMode('map')}
                className='flex-1 text-xs'
              >
                <Map className='h-4 w-4 mr-1' />
                Map
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setViewMode('list')}
                className='flex-1 text-xs'
              >
                <List className='h-4 w-4 mr-1' />
                List
              </Button>

            </div>
          </div>
        </div>
      </div>

      {/* Camera Content - List or Map View */}
      <div className='flex-1'>
        {viewMode === 'map' ? (
          <CameraMapView 
            cameras={filteredCameras}
            onCameraSelect={handleCameraSelection}
            selectedCamera={selectedCamera}
          />
        ) : (
          <div className='h-full scrollable'>
            <div className='p-4 space-y-2'>
              {filteredCameras.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <CameraIcon className='h-16 w-16 text-muted-foreground/50 mb-4' />
                  <h3 className='text-lg font-medium mb-2'>No cameras found</h3>
                  <p className='text-muted-foreground text-sm'>
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              ) : (
                filteredCameras.map((camera) => (
              <div
                key={camera.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedCamera?.id === camera.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/50'
                }`}
                onClick={() => handleCameraSelection(camera)}
              >
                <div className='flex justify-between items-start mb-2'>
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-medium text-sm sm:text-base truncate'>
                      {camera.name}
                    </h3>
                    <div className='flex items-center gap-1 mt-1'>
                      <MapPin className='h-3 w-3 text-muted-foreground' />
                      <span className='text-xs sm:text-sm text-muted-foreground'>
                        {camera.area}
                      </span>
                    </div>
                  </div>
                  {selectedCamera?.id === camera.id && (
                    <div className='w-6 h-6 rounded-full bg-primary flex items-center justify-center ml-3'>
                      <div className='w-2 h-2 rounded-full bg-primary-foreground' />
                    </div>
                  )}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {camera.latitude.toFixed(4)}, {camera.longitude.toFixed(4)}
                </div>
              </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Camera Preview & Action */}
      {selectedCamera && (
        <div className='border-t bg-background/95 backdrop-blur-sm'>
          <div className='p-4'>
            <div className='flex items-center justify-between gap-4 mb-4'>
              <div className='flex-1 min-w-0'>
                <h4 className='font-medium text-sm truncate'>
                  {selectedCamera.name}
                </h4>
                <p className='text-xs text-muted-foreground'>
                  {selectedCamera.area}
                </p>
              </div>
              <Badge variant='default' className='shrink-0'>
                Selected
              </Badge>
            </div>

            <Button
              onClick={handleConfirmSelection}
              disabled={isLoading}
              className='w-full h-12 text-base font-medium'
              size='lg'
            >
              {isLoading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2' />
                  Loading...
                </>
              ) : (
                <>
                  Start Live Preview
                  <ArrowRight className='h-4 w-4 ml-2' />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
