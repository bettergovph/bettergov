import { FloodYearEnum, HazardLevelEnum } from '@/enum/map.enum';
import { IMapboxTileSet } from '@/types/map.type';

export const MAX_SIMULATION_FLOOD_DEPTH = 6;

export const HAZARD_LEVEL: Record<
  HazardLevelEnum,
  { color: string; label: string }
> = {
  1: { label: 'Low', color: 'rgba(255, 235, 100, 0.6)' },
  2: { label: 'Medium', color: 'rgba(255, 165, 0, 0.6)' },
  3: { label: 'High', color: 'rgba(220, 50, 50, 0.6)' },
};

export const HAZARD_BASE: Record<number, number> = {
  1: 0, // low hazard – higher ground
  2: 0.5, // medium hazard – mid ground
  3: 1, // high hazard – lowest ground, floods first
};

export const FLOOD_YEAR_CONFIG: Record<
  FloodYearEnum,
  { minDepth: number; maxDepth: number }
> = {
  '5-Year Flood': {
    minDepth: 0.3, // minimum depth to appear in high hazard
    maxDepth: 1.5,
  },
  '25-Year Flood': {
    minDepth: 0.5,
    maxDepth: 3,
  },
  '100-Year Flood': {
    minDepth: 1,
    maxDepth: 6,
  },
};

// NOTE: can also be moved to data folder as json but I've temporarily placed it here for type safety
export const MAPBOX_TILESET: Record<FloodYearEnum, IMapboxTileSet[]> = {
  '5-Year Flood': [
    { tileSetId: 'upri-noah.ph_fh_5yr_tls', sourceLayer: 'PH010000000_FH_5yr' },
    { tileSetId: 'upri-noah.ph_fh_5yr_tls', sourceLayer: 'PH020000000_FH_5yr' },
    { tileSetId: 'upri-noah.ph_fh_5yr_tls', sourceLayer: 'PH030000000_FH_5yr' },
    { tileSetId: 'upri-noah.ph_fh_5yr_tls', sourceLayer: 'PH040000000_FH_5yr' },
    { tileSetId: 'upri-noah.ph_fh_5yr_tls', sourceLayer: 'PH050000000_FH_5yr' },
    { tileSetId: 'upri-noah.ph_fh_5yr_tls', sourceLayer: 'PH060000000_FH_5yr' },
    { tileSetId: 'upri-noah.ph_fh_5yr_tls', sourceLayer: 'PH070000000_FH_5yr' },
    { tileSetId: 'upri-noah.ph_fh_5yr_tls', sourceLayer: 'PH080000000_FH_5yr' },
    { tileSetId: 'upri-noah.ph_fh_5yr_tls', sourceLayer: 'PH090000000_FH_5yr' },
    { tileSetId: 'upri-noah.ph_fh_5yr_tls', sourceLayer: 'PH100000000_FH_5yr' },
    { tileSetId: 'upri-noah.ph_fh_5yr_tls', sourceLayer: 'PH110000000_FH_5yr' },
    { tileSetId: 'upri-noah.ph_fh_5yr_tls', sourceLayer: 'PH120000000_FH_5yr' },
    { tileSetId: 'upri-noah.ph_fh_5yr_tls', sourceLayer: 'PH130000000_FH_5yr' },
    { tileSetId: 'upri-noah.ph_fh_5yr_tls', sourceLayer: 'PH140000000_FH_5yr' },
    { tileSetId: 'upri-noah.ph_fh_5yr_tls', sourceLayer: 'PH150000000_FH_5yr' },
    { tileSetId: 'upri-noah.ph_fh_5yr_tls', sourceLayer: 'PH160000000_FH_5yr' },
    { tileSetId: 'upri-noah.ph_fh_5yr_tls', sourceLayer: 'PH170000000_FH_5yr' },
    { tileSetId: 'upri-noah.ph_fh_5yr_tls', sourceLayer: 'PH180000000_FH_5yr' },
  ],
  '25-Year Flood': [
    {
      tileSetId: 'upri-noah.ph_fh_25yr_tls',
      sourceLayer: 'PH010000000_FH_25yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_25yr_tls',
      sourceLayer: 'PH020000000_FH_25yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_25yr_tls',
      sourceLayer: 'PH030000000_FH_25yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_25yr_tls',
      sourceLayer: 'PH040000000_FH_25yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_25yr_tls',
      sourceLayer: 'PH050000000_FH_25yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_25yr_tls',
      sourceLayer: 'PH060000000_FH_25yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_25yr_tls',
      sourceLayer: 'PH070000000_FH_25yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_25yr_tls',
      sourceLayer: 'PH080000000_FH_25yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_25yr_tls',
      sourceLayer: 'PH090000000_FH_25yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_25yr_tls',
      sourceLayer: 'PH100000000_FH_25yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_25yr_tls',
      sourceLayer: 'PH110000000_FH_25yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_25yr_tls',
      sourceLayer: 'PH120000000_FH_25yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_25yr_tls',
      sourceLayer: 'PH130000000_FH_25yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_25yr_tls',
      sourceLayer: 'PH140000000_FH_25yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_25yr_tls',
      sourceLayer: 'PH150000000_FH_25yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_25yr_tls',
      sourceLayer: 'PH160000000_FH_25yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_25yr_tls',
      sourceLayer: 'PH170000000_FH_25yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_25yr_tls',
      sourceLayer: 'PH180000000_FH_25yr',
    },
  ],

  '100-Year Flood': [
    {
      tileSetId: 'upri-noah.ph_fh_100yr_tls',
      sourceLayer: 'PH010000000_FH_100yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_100yr_tls',
      sourceLayer: 'PH020000000_FH_100yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_100yr_tls',
      sourceLayer: 'PH030000000_FH_100yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_100yr_tls',
      sourceLayer: 'PH040000000_FH_100yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_100yr_tls',
      sourceLayer: 'PH050000000_FH_100yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_100yr_tls',
      sourceLayer: 'PH060000000_FH_100yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_100yr_tls',
      sourceLayer: 'PH070000000_FH_100yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_100yr_tls',
      sourceLayer: 'PH080000000_FH_100yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_100yr_tls',
      sourceLayer: 'PH090000000_FH_100yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_100yr_tls',
      sourceLayer: 'PH100000000_FH_100yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_100yr_tls',
      sourceLayer: 'PH110000000_FH_100yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_100yr_tls',
      sourceLayer: 'PH120000000_FH_100yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_100yr_tls',
      sourceLayer: 'PH130000000_FH_100yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_100yr_tls',
      sourceLayer: 'PH140000000_FH_100yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_100yr_tls',
      sourceLayer: 'PH150000000_FH_100yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_100yr_tls',
      sourceLayer: 'PH160000000_FH_100yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_100yr_tls',
      sourceLayer: 'PH170000000_FH_100yr',
    },
    {
      tileSetId: 'upri-noah.ph_fh_100yr_tls',
      sourceLayer: 'PH180000000_FH_100yr',
    },
  ],
};
