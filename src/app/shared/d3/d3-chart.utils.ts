import * as d3 from 'd3';
import { ChartBox, ChartSize, ChartSizeOptions, SvgSelection } from './d3-chart.types';

export function clearChart(host: HTMLElement): void {
  d3.select(host).selectAll('*').interrupt().remove();
}

export function createSvg(host: HTMLElement, size: ChartSize, label: string): SvgSelection {
  return d3
    .select(host)
    .append('svg')
    .attr('viewBox', `0 0 ${size.width} ${size.height}`)
    .attr('role', 'img')
    .attr('aria-label', label);
}

export function getChartSize(host: HTMLElement, options: ChartSizeOptions = {}): ChartSize {
  const rect = host.getBoundingClientRect();

  return {
    width: Math.max(options.minWidth ?? 360, Math.round(rect.width || options.fallbackWidth || 720)),
    height: Math.max(options.minHeight ?? 440, Math.round(rect.height || options.fallbackHeight || 460)),
  };
}

export function addAxisLabel(svg: SvgSelection, x: number, y: number, label: string): void {
  svg
    .append('text')
    .attr('x', x)
    .attr('y', y)
    .attr('text-anchor', 'middle')
    .attr('fill', '#64748b')
    .attr('font-size', 12)
    .attr('font-weight', 800)
    .text(label);
}

export function drawPanelFrame(svg: SvgSelection, box: ChartBox, title: string): void {
  svg
    .append('rect')
    .attr('x', box.x)
    .attr('y', box.y)
    .attr('width', box.width)
    .attr('height', box.height)
    .attr('rx', 8)
    .attr('fill', '#f8fafc')
    .attr('stroke', '#dbe4ef');

  svg
    .append('text')
    .attr('x', box.x + 18)
    .attr('y', box.y + 25)
    .attr('fill', '#111827')
    .attr('font-size', 13)
    .attr('font-weight', 900)
    .text(title);
}

export function fitLabel(label: string, width: number): string {
  if (width > 92 || label.length <= 8) {
    return label;
  }

  return `${label.slice(0, 7)}...`;
}

export function showTooltip(tooltip: HTMLElement, host: HTMLElement, event: MouseEvent, title: string, detail: string): void {
  const titleElement = document.createElement('strong');
  const detailElement = document.createElement('span');

  titleElement.textContent = title;
  detailElement.textContent = detail;
  tooltip.replaceChildren(titleElement, detailElement);
  tooltip.style.opacity = '1';
  moveTooltip(tooltip, host, event);
}

export function moveTooltip(tooltip: HTMLElement, host: HTMLElement, event: MouseEvent): void {
  const [x, y] = d3.pointer(event, host);
  tooltip.style.transform = `translate3d(${x + 24}px, ${y + 18}px, 0)`;
}

export function hideTooltip(tooltip?: HTMLElement): void {
  if (!tooltip) {
    return;
  }

  tooltip.style.opacity = '0';
}
