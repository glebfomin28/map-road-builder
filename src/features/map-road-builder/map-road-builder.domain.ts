import type {
  FeatureCollection as GeoJSONFeatureCollection,
  Feature as GeoJSONFeature,
  LineString as GeoJSONLineString,
} from "geojson";

/**
 * Свойства каждой дороги (properties).
 */
export interface IRoadProperties {
  name: string | null;
  "name:en": string | null;
  highway: string | null;
  surface: string | null;
  smoothness: string | null;
  width: string | null;
  lanes: string | null;
  oneway: string | null;
  bridge: string | null;
  layer: string | null;
  source: string | null;
  "name:ar": string | null;
  osm_id: number;
  osm_type: string;
}

/**
 * Геометрия LineString ([[lng, lat], ...])
 */
export interface IRoadLineString extends GeoJSONLineString {
  type: "LineString";
  coordinates: [number, number][];
}

/**
 * Описание одной дороги (Feature),
 */
export interface IRoadFeature extends GeoJSONFeature<IRoadLineString, IRoadProperties> {
  type: "Feature";
  properties: IRoadProperties;
  geometry: IRoadLineString;
}

/**
 * Коллекция дорог (FeatureCollection),
 */
export interface IGeoJsonCollection
  extends GeoJSONFeatureCollection<IRoadLineString, IRoadProperties> {
  type: "FeatureCollection";
  name: string;
  features: IRoadFeature[];
}

export type TNodeId = string;

export interface IGraphNode {
  id: TNodeId;
  lat: number;
  lng: number;
  neighbors: { nodeId: TNodeId; distance: number }[];
}

export interface TPQItem {
  nodeId: TNodeId;
  dist: number;
}

export type TGraph = Record<TNodeId, IGraphNode>;

export interface IBBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}
