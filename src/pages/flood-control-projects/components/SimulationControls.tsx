import SelectPicker from '@/components/ui/SelectPicker';
import { FloodYearEnum } from '@/enum/map.enum';
import Button from '../../../components/ui/Button';
import { HAZARD_LEVEL, MAX_SIMULATION_FLOOD_DEPTH } from '../constants';

interface ISimulationControlsProps {
  simulation: {
    simulating: boolean;
    floodDepth: number;
  };
  selectedFloodYear: FloodYearEnum;
  setSelectedFloodYear: (year: FloodYearEnum) => void;
  toggleFloodSimulation: (simulate: boolean, reset?: boolean) => void;
  handleStopSimulation: () => void;
}

const SimulationControls = ({
  simulation,
  selectedFloodYear,
  setSelectedFloodYear,
  toggleFloodSimulation,
  handleStopSimulation,
}: ISimulationControlsProps) => (
  <div className='absolute top-4 left-4 z-10 flex flex-col gap-2 rounded bg-white p-4 min-w-3xs'>
    {simulation.simulating || simulation.floodDepth ? (
      <>
        <div>
          <p>{selectedFloodYear}</p>
          <p className='text-gray-600'>
            Flood depth: ≈ {simulation.floodDepth.toFixed(1)} m
          </p>
        </div>
        {simulation.simulating ? (
          simulation.floodDepth >= MAX_SIMULATION_FLOOD_DEPTH ? (
            <Button
              variant='outline'
              size='sm'
              onClick={() => toggleFloodSimulation(true, true)}
            >
              Repeat
            </Button>
          ) : (
            <Button
              variant='outline'
              size='sm'
              onClick={() => toggleFloodSimulation(false)}
            >
              Pause
            </Button>
          )
        ) : (
          <Button
            variant='outline'
            size='sm'
            onClick={() => toggleFloodSimulation(true)}
          >
            Resume
          </Button>
        )}
        <Button variant='primary' size='sm' onClick={handleStopSimulation}>
          Stop
        </Button>
      </>
    ) : (
      <>
        <SelectPicker
          selectedValue={selectedFloodYear}
          options={Object.values(FloodYearEnum).map(val => ({
            label: val,
            value: val,
          }))}
          onSelect={data => setSelectedFloodYear(data?.value as FloodYearEnum)}
          clearable={false}
          searchable={false}
        />
        <div className='flex flex-col gap-2'>
          {Object.values(HAZARD_LEVEL).map(({ color, label }, idx) => (
            <div className='flex flex-row gap-2 items-center' key={idx}>
              <div className={`h-4 w-4`} style={{ backgroundColor: color }} />
              <p>{label}</p>
            </div>
          ))}
        </div>
        <Button
          className='mt-2'
          variant='primary'
          aria-label='Simulate flood'
          size='sm'
          onClick={() => toggleFloodSimulation(true, true)}
        >
          Run flood simulation
        </Button>
      </>
    )}
  </div>
);

export default SimulationControls;
