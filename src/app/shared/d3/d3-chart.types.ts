import * as d3 from 'd3';

export interface ChartSize {
  width: number;
  height: number;
}

export interface ChartBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChartSizeOptions {
  minWidth?: number;
  minHeight?: number;
  fallbackWidth?: number;
  fallbackHeight?: number;
}

export type SvgSelection = d3.Selection<SVGSVGElement, unknown, null, undefined>;
