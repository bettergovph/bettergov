export interface IMapboxTileSet {
  tileSetId: string;
  sourceLayer: string;
}

export interface IMapStyle {
  style: 'standard' | 'satellite';
  showRain: boolean;
}
