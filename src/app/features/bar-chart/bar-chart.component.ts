import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import { BarDatum } from '../../core/models/roadmap.models';
import { RoadmapDataService } from '../../core/services/roadmap-data.service';
import {
  addAxisLabel,
  clearChart,
  createSvg,
  getChartSize,
  hideTooltip,
  moveTooltip,
  showTooltip,
} from '../../shared/d3/d3-chart.utils';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  templateUrl: './bar-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() refreshKey = 0;
  @ViewChild('chartHost', { static: true }) private chartHost!: ElementRef<HTMLDivElement>;
  @ViewChild('tooltip', { static: true }) private tooltip!: ElementRef<HTMLDivElement>;

  private data: BarDatum[] = [];
  private resizeObserver?: ResizeObserver;
  private viewReady = false;

  constructor(
    private readonly dataService: RoadmapDataService,
    private readonly zone: NgZone,
  ) {
    this.data = this.dataService.getFallbackBarData();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    void this.loadAndRender();

    this.zone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => this.render());
      this.resizeObserver.observe(this.chartHost.nativeElement);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.viewReady && changes['refreshKey']) {
      window.requestAnimationFrame(() => this.render());
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private async loadAndRender(): Promise<void> {
    this.data = await this.dataService.loadBarData();
    this.render();
  }

  private render(): void {
    if (!this.viewReady) {
      return;
    }

    const host = this.chartHost.nativeElement;
    const tooltip = this.tooltip.nativeElement;
    clearChart(host);
    hideTooltip(tooltip);

    const size = getChartSize(host);
    const margin = { top: 32, right: 32, bottom: 60, left: 138 };
    const svg = createSvg(host, size, 'Static CSV bar chart');
    const chartWidth = size.width - margin.left - margin.right;

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(this.data, (datum) => datum.hours) ?? 0])
      .nice()
      .range([margin.left, size.width - margin.right]);
    const y = d3
      .scaleBand()
      .domain(this.data.map((datum) => datum.topic))
      .range([margin.top, size.height - margin.bottom])
      .padding(0.2);

    svg
      .append('g')
      .attr('transform', `translate(0,${size.height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(Math.max(4, Math.floor(chartWidth / 120))).tickSizeOuter(0))
      .call((group) => group.select('.domain').attr('stroke', '#cbd5e1'))
      .call((group) => group.selectAll('line').attr('stroke', '#d8e0ea'))
      .call((group) => group.selectAll('text').attr('fill', '#64748b'));

    svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickSize(0))
      .call((group) => group.select('.domain').remove())
      .call((group) => group.selectAll('text').attr('fill', '#334155').attr('font-weight', 700));

    svg
      .append('g')
      .attr('stroke', '#e6edf5')
      .selectAll('line')
      .data(x.ticks(5))
      .join('line')
      .attr('x1', (datum) => x(datum))
      .attr('x2', (datum) => x(datum))
      .attr('y1', margin.top)
      .attr('y2', size.height - margin.bottom);

    const bars = svg
      .append('g')
      .selectAll<SVGRectElement, BarDatum>('rect')
      .data(this.data, (datum) => datum.topic)
      .join('rect')
      .attr('x', margin.left)
      .attr('y', (datum) => y(datum.topic) ?? 0)
      .attr('width', 0)
      .attr('height', y.bandwidth())
      .attr('rx', 6)
      .attr('fill', (_, index) => d3.schemeTableau10[index % d3.schemeTableau10.length])
      .on('mouseenter', (event, datum) =>
        showTooltip(tooltip, host, event, datum.topic, `${datum.hours} focused practice hours`),
      )
      .on('mousemove', (event) => moveTooltip(tooltip, host, event))
      .on('mouseleave', () => hideTooltip(tooltip));

    bars
      .transition()
      .duration(650)
      .ease(d3.easeCubicOut)
      .attr('width', (datum) => Math.max(0, x(datum.hours) - margin.left));

    svg
      .append('g')
      .selectAll('text')
      .data(this.data)
      .join('text')
      .attr('x', (datum) => x(datum.hours) + 8)
      .attr('y', (datum) => (y(datum.topic) ?? 0) + y.bandwidth() / 2)
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#334155')
      .attr('font-size', 12)
      .attr('font-weight', 800)
      .text((datum) => `${datum.hours}h`);

    addAxisLabel(svg, size.width / 2, size.height - 16, 'Practice hours');
  }
}
