
import { describe, it, expect } from 'vitest';
import { resolveRegionPopulationKey } from './regionMapping';
import pop2020Raw from '../data/population-2020.json';

describe('Region Mapping and Population Data', () => {
  it('should resolve "Negros Island Region" to "NIR" and have population data', () => {
    const regionName = 'Negros Island Region';
    const popKey = resolveRegionPopulationKey(regionName);

    expect(popKey).toBe('NIR');

    const pop2020 = pop2020Raw as any;
    const regionData = pop2020.regions[popKey];

    expect(regionData).toBeDefined();
    expect(regionData.totalPopulation).toBe(4159557);
    expect(regionData.householdPopulation).toBe(4150234);
    expect(regionData.households).toBe(1011733);
  });
});
