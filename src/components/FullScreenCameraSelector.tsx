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

import { Search, Filter, Settings, X } from 'lucide-react';
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
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);

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


  return (
    <div className='relative h-full w-full overflow-hidden'>
      {/* Full-screen Map */}
      <div className='absolute inset-0'>
        <CameraMapView 
          cameras={filteredCameras}
          onCameraSelect={handleCameraSelection}
          selectedCamera={selectedCamera}
          onStartPreview={onCameraSelect}
          isLoading={isLoading}
        />
      </div>

      {/* Desktop: Always show controls - Bottom Right */}
      <div className='hidden md:block absolute bottom-4 right-4 z-1001 space-y-3'>
        {/* Search Bar */}
        <div className='bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-white/20 p-3 w-80'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
            <Input
              placeholder='Search NYC cameras...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-9 text-sm border-0 bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-primary'
            />
          </div>
        </div>
        
        {/* Borough Filter */}
        <div className='bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-white/20 p-2'>
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className='border-0 bg-transparent shadow-none focus:ring-1 focus:ring-primary h-8 text-sm w-full'>
              <div className='flex items-center gap-2'>
                <Filter className='h-3 w-3 text-muted-foreground shrink-0' />
                <SelectValue placeholder='Borough' />
              </div>
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
      </div>

      {/* Mobile: Expandable controls toggle - Top Right (next to location button) */}
      <div className='md:hidden absolute top-4 right-16 z-1001'>
        <Button
          onClick={() => setIsControlsExpanded(!isControlsExpanded)}
          className='bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-white/20 h-10 w-10 p-0 hover:bg-white'
          variant='ghost'
          title={isControlsExpanded ? 'Close search filters' : 'Open search filters'}
        >
          {isControlsExpanded ? (
            <X className='h-5 w-5 text-gray-700' />
          ) : (
            <Settings className='h-5 w-5 text-gray-700' />
          )}
        </Button>
      </div>

      {/* Mobile: Expandable controls panel */}
      {isControlsExpanded && (
        <div className='md:hidden absolute top-16 right-16 z-1001 space-y-3 w-72 max-w-[calc(100vw-4rem)]'>
          {/* Search Bar */}
          <div className='bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-white/20 p-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
              <Input
                placeholder='Search NYC cameras...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-9 text-sm border-0 bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-primary'
              />
            </div>
          </div>
          
          {/* Borough Filter */}
          <div className='bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-white/20 p-2'>
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className='border-0 bg-transparent shadow-none focus:ring-1 focus:ring-primary h-8 text-sm w-full'>
                <div className='flex items-center gap-2'>
                  <Filter className='h-3 w-3 text-muted-foreground shrink-0' />
                  <SelectValue placeholder='Borough' />
                </div>
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
        </div>
      )}

    </div>
  );
}
