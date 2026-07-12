import { Project } from '../models/roadmap.models';

export const ROADMAP_PROJECTS: Project[] = [
  {
    key: 'bar',
    index: '01',
    title: 'Static CSV Bar Chart',
    subtitle: 'Week 1 foundation',
    phase: 'Week 1 · Foundations',
    description:
      'Render a clean SVG bar chart from CSV data while practicing DOM/SVG basics, selections, attributes, scales, and axis labels.',
    milestone: 'Static bar chart rendered from a CSV file with correct x/y axes.',
    brief:
      'This first project turns roadmap practice hours into a horizontal bar chart, matching the CSV loading and SVG fundamentals milestone.',
    chartLabel: 'CSV milestone',
    chartTitle: 'Foundation Topics by Practice Hours',
    focus: ['HTML/CSS/JS recap', 'SVG rects and text', 'D3 selections', 'CSV parsing', 'Linear/band scales', 'Axis labels'],
    outputs: ['CSV-backed data model', 'Responsive SVG viewBox', 'Readable axes', 'Value labels'],
  },
  {
    key: 'line',
    index: '02',
    title: 'Interactive Line Chart',
    subtitle: 'Week 2 core D3',
    phase: 'Week 2 · Core D3 Concepts',
    description:
      'Use time and linear scales to build an interactive line chart with formatted axes, markers, and pointer-driven tooltips.',
    milestone: 'Interactive line chart with time-series data, formatted axes, and tooltips.',
    brief:
      'The line chart emphasizes data joins, time-series scales, axis formatting, and tooltip events from the second roadmap phase.',
    chartLabel: 'Interaction milestone',
    chartTitle: 'Learning Velocity Across Week 2',
    focus: ['Data join', 'Line/area generators', 'Time/linear scales', 'Tick formatting', 'Tooltips', 'Pointer focus'],
    outputs: ['Hover states', 'Formatted dates', 'Animated line path', 'Area layer'],
  },
  {
    key: 'treemap',
    index: '03',
    title: 'Animated Treemap',
    subtitle: 'Week 3 layouts',
    phase: 'Week 3 · Charts, Layouts & Animation',
    description:
      'Convert nested project work into a treemap with hierarchical layout, color encoding, transitions, and node selection.',
    milestone: 'Animated treemap or force-directed graph with transitions and color encoding.',
    brief:
      'This project applies d3.hierarchy and d3.treemap to nested chart skills, then adds transitions and interactive selection.',
    chartLabel: 'Layout milestone',
    chartTitle: 'Visualization Skill Tree',
    focus: ['Hierarchy', 'Treemap layout', 'Nested JSON', 'Ordinal color', 'Transitions/easing', 'Node selection'],
    outputs: ['Nested JSON layout', 'Animated cells', 'Keyboard/click selection', 'Interactive details'],
  },
  {
    key: 'dashboard',
    index: '04',
    title: 'Choropleth Dashboard',
    subtitle: 'Week 4 capstone',
    phase: 'Week 4 · Advanced & Expert Topics',
    description:
      'Combine a GeoJSON choropleth map, time-series trend, and linked bar chart into a compact dashboard with brush filtering.',
    milestone: 'Full dashboard: choropleth map + line chart + cross-filtering bar chart.',
    brief:
      'The capstone joins geographic paths, sequential color, a line chart, and brush-driven cross-filtering in one Angular view.',
    chartLabel: 'Capstone milestone',
    chartTitle: 'Regional Adoption Dashboard',
    focus: ['Geo projection', 'GeoJSON paths', 'Choropleth legend', 'Brush', 'Cross-filter', 'ResizeObserver'],
    outputs: ['Linked charts', 'Sequential color legend', 'Brush-filtered bars', 'Responsive SVG shell'],
  },
  {
    key: 'shape',
    index: '05',
    title: 'Shape Generator Studio',
    subtitle: 'Week 3 shapes',
    phase: 'Week 3 · Charts, Layouts & Animation',
    description:
      'Use pie, arc, and stack generators to build animated donut and stacked charts with legends and tooltips.',
    milestone: 'Pie/donut and stacked chart patterns rendered with shape generators and arc tweening.',
    brief:
      'This studio covers the roadmap shape-generator days: d3.pie, d3.arc, d3.stack, legends, and smooth path interpolation.',
    chartLabel: 'Shape milestone',
    chartTitle: 'Generator Patterns and Stacked Practice',
    focus: ['Pie layout', 'Arc generator', 'Arc tween', 'Stack generator', 'Legend', 'Path tooltips'],
    outputs: ['Animated donut slices', 'Stacked topic bars', 'Color legend', 'Interpolated paths'],
  },
  {
    key: 'layout',
    index: '06',
    title: 'Force and Layout Lab',
    subtitle: 'Week 3 layouts',
    phase: 'Week 3 · Charts, Layouts & Animation',
    description:
      'Render force, pack, and tree layouts from shared structured data while practicing live simulation updates.',
    milestone: 'Force graph plus pack and tree layouts rendered from nested/network data.',
    brief:
      'The layout lab fills the roadmap layout gap with d3.forceSimulation, d3.pack, d3.tree, links, nodes, and hierarchical sizing.',
    chartLabel: 'Layout lab',
    chartTitle: 'Force, Pack, and Tree Layouts',
    focus: ['Force simulation', 'Force links', 'Pack layout', 'Tree layout', 'Node/link joins', 'Hierarchy sizing'],
    outputs: ['Live network graph', 'Circle packing', 'Tree links', 'Interactive nodes'],
  },
  {
    key: 'zoom',
    index: '07',
    title: 'Zoom and Live Stream',
    subtitle: 'Week 4 interaction',
    phase: 'Week 4 · Advanced & Expert Topics',
    description:
      'Combine zoom and pan with a simulated real-time line chart that slides its time domain as new data arrives.',
    milestone: 'Real-time line chart with zoom, pan, reset, and smooth domain updates.',
    brief:
      'This project covers the roadmap zoom and real-time days with d3.zoom, scale transforms, interval-driven data, and animated line updates.',
    chartLabel: 'Interaction lab',
    chartTitle: 'Streaming Signal With Zoom Control',
    focus: ['d3.zoom', 'Scale extent', 'Pan transform', 'Reset control', 'setInterval stream', 'Sliding time domain'],
    outputs: ['Live line updates', 'Zoomable plot area', 'Reset action', 'Moving time window'],
  },
  {
    key: 'production',
    index: '08',
    title: 'Production Matrix',
    subtitle: 'Week 4 publishing',
    phase: 'Week 4 · Advanced & Expert Topics',
    description:
      'Track framework integration, accessibility, export, reusable component patterns, packaging, and deployment readiness.',
    milestone: 'Production-readiness matrix with integration, export, packaging, Observable, and GitHub Pages coverage.',
    brief:
      'The final lab covers the non-chart production topics from the roadmap, including React-style integration patterns, print export, reusable renderers, and deployment steps.',
    chartLabel: 'Production lab',
    chartTitle: 'Integration, Export, and Publishing Readiness',
    focus: ['React useRef/useEffect pattern', 'ARIA labels', 'Print export', 'Reusable closure renderer', 'npm package checklist', 'GitHub Pages build'],
    outputs: ['Production matrix', 'Print-ready view', 'Reusable renderer pattern', 'Publishing checklist'],
  },
];
