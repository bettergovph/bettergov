export interface IFloodControlProject {
  GlobalID?: string;
  objectID?: string;
  ProjectDescription?: string;
  InfraYear?: string;
  Region?: string;
  Province?: string;
  Municipality?: string;
  TypeofWork?: string;
  Contractor?: string;
  ContractCost?: string;
  Latitude?: string;
  Longitude?: string;
}

export interface IMapFloodSimulationState {
  simulating: boolean;
  floodDepth: number;
}

export interface IRegionData {
  id: string;
  name: string;
  description?: string;
  population?: string;
  capital?: string;
  area?: string;
  provinces?: string[];
  wikipedia?: string;
  loading?: boolean;
  projectCount?: number;
  totalCost?: number;
}

export interface IRegionProperties {
  name: string;
  capital?: string;
  population?: string;
  provinces?: string[];
}

export interface IMapboxTileSet {
  tileSetId: string;
  sourceLayer: string;
}

export type TStyle = 'standard' | 'satellite';

export interface IMapStyle {
  style: TStyle;
  showRain: boolean;
}
