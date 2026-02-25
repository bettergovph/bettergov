/**
 * Custom hook for loading flood control lookup data
 */

import { useState, useEffect } from 'react';
import { fetchFloodControlLookup } from '../lib/cms-data';

export interface DataItem {
  value: string;
  count: number;
}

export interface FloodControlLookups {
  infraYear: DataItem[];
  region: DataItem[];
  province: DataItem[];
  deo: DataItem[];
  legislativeDistrict: DataItem[];
  typeOfWork: DataItem[];
  contractor: DataItem[];
}

interface LookupData {
  InfraYear?: DataItem[];
  Region?: DataItem[];
  Province?: DataItem[];
  DistrictEngineeringOffice?: DataItem[];
  LegislativeDistrict?: DataItem[];
  TypeofWork?: DataItem[];
  Contractor?: DataItem[];
}

export function useFloodControlLookups() {
  const [lookups, setLookups] = useState<FloodControlLookups | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    Promise.all([
      fetchFloodControlLookup('InfraYear_with_counts'),
      fetchFloodControlLookup('Region_with_counts'),
      fetchFloodControlLookup('Province_with_counts'),
      fetchFloodControlLookup('DistrictEngineeringOffice_with_counts'),
      fetchFloodControlLookup('LegislativeDistrict_with_counts'),
      fetchFloodControlLookup('TypeofWork_with_counts'),
      fetchFloodControlLookup('Contractor_with_counts'),
    ])
      .then(
        ([
          infraYearData,
          regionData,
          provinceData,
          deoData,
          legislativeDistrictData,
          typeOfWorkData,
          contractorData,
        ]) => {
          setLookups({
            infraYear: (infraYearData as LookupData).InfraYear || [],
            region: (regionData as LookupData).Region || [],
            province: (provinceData as LookupData).Province || [],
            deo: (deoData as LookupData).DistrictEngineeringOffice || [],
            legislativeDistrict:
              (legislativeDistrictData as LookupData).LegislativeDistrict || [],
            typeOfWork: (typeOfWorkData as LookupData).TypeofWork || [],
            contractor: (contractorData as LookupData).Contractor || [],
          });
          setLoading(false);
        }
      )
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { lookups, loading, error };
}
