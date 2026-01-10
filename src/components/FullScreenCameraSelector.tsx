import { useState } from 'react';
import type { Camera } from '../types/Camera';
import { Button } from './ui/button';
import { Input } from './ui/input';

import { Search, X } from 'lucide-react';
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
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const filteredCameras = cameras.filter((camera) => {
    const matchesSearch = camera.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const isOnline = camera.isOnline;
    return matchesSearch && isOnline;
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

      {/* Top Right Search Toggle */}
      <div id="tour-search-wrapper" className={`absolute top-4 right-4 z-1001 flex items-center justify-end transition-all duration-300 ease-in-out ${isSearchOpen ? 'w-[calc(100vw-6rem)] md:w-80' : 'w-10'}`}>
        <div className={`flex items-center bg-background/95 backdrop-blur-md rounded-lg shadow-lg border border-border/50 overflow-hidden ${isSearchOpen ? 'w-full p-1' : 'w-10 h-10 justify-center'}`}>
          {isSearchOpen ? (
            <>
              <Search className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
              <Input
                id="tour-search-input"
                autoFocus
                placeholder='Search cameras...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='border-0 bg-transparent shadow-none focus-visible:ring-0 h-8 text-sm w-full text-foreground placeholder:text-muted-foreground'
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 shrink-0 hover:bg-accent rounded-full" 
                onClick={() => { 
                  setIsSearchOpen(false); 
                  setSearchTerm(''); 
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button 
              id="tour-search-toggle"
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 p-0 hover:bg-accent rounded-lg" 
              onClick={() => setIsSearchOpen(true)}
              title="Search cameras"
            >
              <Search className="h-5 w-5 text-foreground" />
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}
