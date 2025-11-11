import { MapIcon, SatelliteIcon, ZoomInIcon, ZoomOutIcon } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { IMapStyle } from '../types';

interface IMapControlsProps {
  mapStyle: IMapStyle;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleSwitchMapStyle: () => void;
}

const MapControls = ({
  mapStyle,
  handleZoomIn,
  handleZoomOut,
  handleSwitchMapStyle,
}: IMapControlsProps) => (
  <div className='absolute top-4 right-4 z-10 flex flex-col gap-2'>
    <Button
      variant='primary'
      size='sm'
      onClick={handleZoomIn}
      aria-label='Zoom in'
    >
      <ZoomInIcon className='h-4 w-4' />
    </Button>
    <Button
      variant='primary'
      size='sm'
      onClick={handleZoomOut}
      aria-label='Zoom out'
    >
      <ZoomOutIcon className='h-4 w-4' />
    </Button>
    <Button
      variant='primary'
      size='sm'
      aria-label={
        mapStyle.style === 'satellite' ? 'Standard View' : 'Satellite View'
      }
      onClick={handleSwitchMapStyle}
    >
      {mapStyle.style === 'satellite' ? (
        <MapIcon className='h-4 w-4' />
      ) : (
        <SatelliteIcon className='h-4 w-4' />
      )}
    </Button>
  </div>
);

export default MapControls;
