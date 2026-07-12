import {
  DashboardMonth,
  ForceLinkDatum,
  ForceNodeDatum,
  LineDatum,
  ProductionTopic,
  RegionalGeoCollection,
  RegionDatum,
  ShapeDatum,
  StackedTopicDatum,
  TreeDatum,
} from '../models/roadmap.models';

export const BAR_DATA_CSV = `topic,hours,phase
HTML/CSS review,8,Foundation
Modern JavaScript,14,Foundation
SVG primitives,10,Foundation
CSV and JSON data,9,Foundation
D3 selections,11,Foundation
Chart polish,7,Foundation`;

export const LINE_DATA: LineDatum[] = [
  { date: new Date(2026, 0, 8), score: 24, label: 'Selections' },
  { date: new Date(2026, 0, 9), score: 37, label: 'Data join' },
  { date: new Date(2026, 0, 10), score: 48, label: 'Transitions' },
  { date: new Date(2026, 0, 11), score: 58, label: 'Scales' },
  { date: new Date(2026, 0, 12), score: 67, label: 'Axes' },
  { date: new Date(2026, 0, 13), score: 74, label: 'Tooltips' },
  { date: new Date(2026, 0, 14), score: 86, label: 'Milestone' },
];

export const TREE_DATA: TreeDatum = {
  name: 'D3',
  children: [
    {
      name: 'Shapes',
      children: [
        { name: 'Line', value: 18 },
        { name: 'Area', value: 12 },
        { name: 'Arc', value: 10 },
        { name: 'Stack', value: 9 },
      ],
    },
    {
      name: 'Layouts',
      children: [
        { name: 'Treemap', value: 16 },
        { name: 'Pack', value: 11 },
        { name: 'Tree', value: 13 },
        { name: 'Force', value: 14 },
      ],
    },
    {
      name: 'Motion',
      children: [
        { name: 'Ease', value: 7 },
        { name: 'Delay', value: 8 },
        { name: 'Tween', value: 10 },
      ],
    },
    {
      name: 'Color',
      children: [
        { name: 'Sequential', value: 9 },
        { name: 'Diverging', value: 8 },
        { name: 'Ordinal', value: 7 },
      ],
    },
  ],
};

export const SHAPE_SEGMENTS: ShapeDatum[] = [
  { name: 'Line generators', value: 24, color: '#0f766e' },
  { name: 'Arc and pie', value: 18, color: '#f97316' },
  { name: 'Stack layouts', value: 16, color: '#7c3aed' },
  { name: 'Legends', value: 10, color: '#2563eb' },
  { name: 'Tweening', value: 12, color: '#db2777' },
];

export const STACKED_TOPIC_DATA: StackedTopicDatum[] = [
  { label: 'D15', line: 14, arc: 0, stack: 0 },
  { label: 'D16', line: 8, arc: 13, stack: 0 },
  { label: 'D17', line: 6, arc: 10, stack: 7 },
  { label: 'D18', line: 5, arc: 8, stack: 12 },
  { label: 'D19', line: 4, arc: 7, stack: 16 },
  { label: 'D20', line: 4, arc: 6, stack: 19 },
  { label: 'D21', line: 5, arc: 8, stack: 22 },
];

export const FORCE_NODES: ForceNodeDatum[] = [
  { id: 'D3', group: 'Core', radius: 19 },
  { id: 'Selections', group: 'Core', radius: 13 },
  { id: 'Scales', group: 'Core', radius: 15 },
  { id: 'Axes', group: 'Core', radius: 12 },
  { id: 'Shapes', group: 'Charts', radius: 16 },
  { id: 'Hierarchy', group: 'Layouts', radius: 16 },
  { id: 'Force', group: 'Layouts', radius: 14 },
  { id: 'Geo', group: 'Advanced', radius: 15 },
  { id: 'Brush', group: 'Advanced', radius: 12 },
  { id: 'Zoom', group: 'Advanced', radius: 12 },
  { id: 'Production', group: 'Advanced', radius: 14 },
];

export const FORCE_LINKS: ForceLinkDatum[] = [
  { source: 'D3', target: 'Selections', strength: 0.88 },
  { source: 'D3', target: 'Scales', strength: 0.92 },
  { source: 'Scales', target: 'Axes', strength: 0.76 },
  { source: 'Scales', target: 'Shapes', strength: 0.66 },
  { source: 'Shapes', target: 'Hierarchy', strength: 0.58 },
  { source: 'Hierarchy', target: 'Force', strength: 0.78 },
  { source: 'Hierarchy', target: 'Geo', strength: 0.48 },
  { source: 'Geo', target: 'Brush', strength: 0.64 },
  { source: 'Brush', target: 'Zoom', strength: 0.72 },
  { source: 'Zoom', target: 'Production', strength: 0.52 },
  { source: 'Production', target: 'D3', strength: 0.42 },
];

export const LAYOUT_TREE_DATA: TreeDatum = {
  name: 'Layouts',
  children: [
    {
      name: 'Hierarchy',
      children: [
        { name: 'Tree', value: 10 },
        { name: 'Pack', value: 12 },
        { name: 'Treemap', value: 14 },
      ],
    },
    {
      name: 'Network',
      children: [
        { name: 'Force', value: 15 },
        { name: 'Links', value: 9 },
        { name: 'Ticks', value: 8 },
      ],
    },
    {
      name: 'Geo',
      children: [
        { name: 'Projection', value: 11 },
        { name: 'TopoJSON', value: 7 },
      ],
    },
  ],
};

export const REGIONS: RegionDatum[] = [
  { id: 'north', name: 'Northland', value: 82 },
  { id: 'west', name: 'Westport', value: 63 },
  { id: 'east', name: 'Eastvale', value: 74 },
  { id: 'south', name: 'Southridge', value: 51 },
];

export const DASHBOARD_MONTHS: DashboardMonth[] = [
  { month: new Date(2026, 0, 1), north: 42, west: 36, east: 39, south: 28 },
  { month: new Date(2026, 1, 1), north: 48, west: 40, east: 44, south: 33 },
  { month: new Date(2026, 2, 1), north: 55, west: 45, east: 50, south: 38 },
  { month: new Date(2026, 3, 1), north: 59, west: 49, east: 57, south: 41 },
  { month: new Date(2026, 4, 1), north: 67, west: 54, east: 62, south: 46 },
  { month: new Date(2026, 5, 1), north: 72, west: 58, east: 68, south: 49 },
  { month: new Date(2026, 6, 1), north: 82, west: 63, east: 74, south: 51 },
];

export const REGIONAL_GEO_DATA: RegionalGeoCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { id: 'north', name: 'Northland' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-103, 47], [-96, 50], [-88, 46], [-92, 40], [-101, 41], [-103, 47]]],
      },
    },
    {
      type: 'Feature',
      properties: { id: 'west', name: 'Westport' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-112, 39], [-101, 41], [-99, 31], [-108, 28], [-114, 34], [-112, 39]]],
      },
    },
    {
      type: 'Feature',
      properties: { id: 'east', name: 'Eastvale' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-92, 40], [-84, 44], [-78, 38], [-82, 31], [-94, 32], [-92, 40]]],
      },
    },
    {
      type: 'Feature',
      properties: { id: 'south', name: 'Southridge' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-99, 31], [-94, 32], [-82, 31], [-85, 24], [-100, 24], [-108, 28], [-99, 31]]],
      },
    },
  ],
};

export const PRODUCTION_TOPICS: ProductionTopic[] = [
  {
    area: 'Frameworks',
    topic: 'React useRef/useEffect',
    status: 'Patterned',
    score: 82,
    detail: 'D3 owns an SVG container from a lifecycle hook; framework owns outer state.',
  },
  {
    area: 'Frameworks',
    topic: 'Angular lifecycle bridge',
    status: 'Implemented',
    score: 96,
    detail: 'Charts render after view init and re-render through ResizeObserver.',
  },
  {
    area: 'Accessibility',
    topic: 'ARIA labels and live tooltips',
    status: 'Implemented',
    score: 90,
    detail: 'SVG labels and tooltip status regions are included across chart components.',
  },
  {
    area: 'Export',
    topic: 'Print-ready output',
    status: 'Implemented',
    score: 86,
    detail: 'Print styles and a print action prepare the active chart for browser export.',
  },
  {
    area: 'Reuse',
    topic: 'Closure renderer pattern',
    status: 'Implemented',
    score: 88,
    detail: 'This matrix chart uses a getter/setter renderer closure.',
  },
  {
    area: 'Packaging',
    topic: 'npm package checklist',
    status: 'Ready',
    score: 74,
    detail: 'Build output, README, versioning, and examples are tracked before publishing.',
  },
  {
    area: 'Publishing',
    topic: 'Observable demo',
    status: 'Ready',
    score: 72,
    detail: 'Notebook-ready examples are tracked as a publishing deliverable.',
  },
  {
    area: 'Publishing',
    topic: 'GitHub Pages build',
    status: 'Ready',
    score: 78,
    detail: 'A production build target can be published to GitHub Pages.',
  },
  {
    area: 'Geo',
    topic: 'TopoJSON conversion',
    status: 'Patterned',
    score: 70,
    detail: 'TopoJSON is represented as a deployment dependency pattern before conversion.',
  },
];
