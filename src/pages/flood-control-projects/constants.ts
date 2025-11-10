import { FloodYearEnum, HazardLevelEnum } from '@/enum/map.enum';
import { IMapboxTileSet } from '@/types/map.type';

export const MAX_SIMULATION_FLOOD_DEPTH = 6;

export const HAZARD_LEVEL: Record<
  HazardLevelEnum,
  { color: string; label: string }
> = {
  1: { label: 'Low', color: 'rgba(255, 250, 180, 0.6 )' },
  2: { label: 'Medium', color: 'rgba(255, 200, 140,0.6 )' },
  3: { label: 'High', color: 'rgba(255, 150, 150,0.6 )' },
};

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
