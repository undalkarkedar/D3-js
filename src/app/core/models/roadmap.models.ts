export type ProjectKey = 'bar' | 'line' | 'treemap' | 'dashboard' | 'shape' | 'layout' | 'zoom' | 'production';

export interface Project {
  key: ProjectKey;
  index: string;
  title: string;
  subtitle: string;
  phase: string;
  description: string;
  milestone: string;
  brief: string;
  chartLabel: string;
  chartTitle: string;
  focus: string[];
  outputs: string[];
}

export interface BarDatum {
  topic: string;
  hours: number;
  phase: string;
}

export interface LineDatum {
  date: Date;
  score: number;
  label: string;
}

export type RegionId = 'north' | 'west' | 'east' | 'south';

export interface RegionDatum {
  id: RegionId;
  name: string;
  value: number;
}

export interface TreeDatum {
  name: string;
  value?: number;
  children?: TreeDatum[];
}

export interface ShapeDatum {
  name: string;
  value: number;
  color: string;
}

export type StackTopicKey = 'line' | 'arc' | 'stack';

export type StackedTopicDatum = {
  label: string;
} & Record<StackTopicKey, number>;

export interface ForceNodeDatum {
  id: string;
  group: string;
  radius: number;
}

export interface ForceLinkDatum {
  source: string;
  target: string;
  strength: number;
}

export interface ProductionTopic {
  area: string;
  topic: string;
  status: 'Implemented' | 'Patterned' | 'Ready';
  score: number;
  detail: string;
}

export type DashboardMonth = {
  month: Date;
} & Record<RegionId, number>;

export interface RegionalGeoFeature {
  type: 'Feature';
  properties: {
    id: RegionId;
    name: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface RegionalGeoCollection {
  type: 'FeatureCollection';
  features: RegionalGeoFeature[];
}
