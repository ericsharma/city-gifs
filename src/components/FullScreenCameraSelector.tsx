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
import { Search, ArrowRight } from 'lucide-react';
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
      {/* Search and Filter Controls */}
      <div className='sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b'>
        <div className='p-4 sm:p-6'>
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
          </div>
        </div>
      </div>

      {/* Camera Map View */}
      <div className='flex-1'>
        <CameraMapView 
          cameras={filteredCameras}
          onCameraSelect={handleCameraSelection}
          selectedCamera={selectedCamera}
        />
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
