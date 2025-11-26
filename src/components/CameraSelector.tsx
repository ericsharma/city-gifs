import { useState } from 'react';
import type { Camera } from '../types/Camera';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { Search } from 'lucide-react';

interface CameraSelectorProps {
  cameras: Camera[];
  selectedCamera: Camera | null;
  onCameraSelect: (camera: Camera) => void;
  isLoading?: boolean;
}

export function CameraSelector({
  cameras,
  selectedCamera,
  onCameraSelect,
  isLoading = false,
}: CameraSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');

  const areas = Array.from(
    new Set(cameras.map((camera) => camera.area))
  ).sort();

  const filteredCameras = cameras.filter((camera) => {
    const matchesSearch = camera.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesArea = selectedArea === 'all' || camera.area === selectedArea;
    const isOnline = camera.isOnline === 'true';
    return matchesSearch && matchesArea && isOnline;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select NYC Camera</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
          <Input
            placeholder='Search cameras...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-9'
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className='text-sm font-medium mb-2 block'>Borough</label>
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger>
                <SelectValue placeholder='Select borough' />
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
          <div>
            <label className='text-sm font-medium mb-2 block'>
              Camera ({filteredCameras.length} available)
            </label>
            <Select
              value={selectedCamera?.id || ''}
              onValueChange={(value) => {
                const camera = cameras.find((c) => c.id === value);
                if (camera) onCameraSelect(camera);
              }}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder='Choose a camera' />
              </SelectTrigger>
              <SelectContent className='max-h-[300px]'>
                {filteredCameras.map((camera) => (
                  <SelectItem key={camera.id} value={camera.id}>
                    <div className='flex flex-col'>
                      <span className='font-medium text-sm'>{camera.name}</span>
                      <span className='text-xs text-muted-foreground'>
                        {camera.area}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedCamera && (
          <div className='p-3 bg-muted rounded-lg'>
            <h4 className='font-medium text-sm'>{selectedCamera.name}</h4>
            <div className='flex justify-between items-center mt-1'>
              <p className='text-sm text-muted-foreground'>
                {selectedCamera.area}
              </p>
              <p className='text-xs text-muted-foreground'>
                {selectedCamera.latitude.toFixed(4)}, {selectedCamera.longitude.toFixed(4)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
