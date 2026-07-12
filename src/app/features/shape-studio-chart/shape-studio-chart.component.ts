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
import { ShapeDatum, StackedTopicDatum, StackTopicKey } from '../../core/models/roadmap.models';
import { RoadmapDataService } from '../../core/services/roadmap-data.service';
import { ChartBox, SvgSelection } from '../../shared/d3/d3-chart.types';
import {
  clearChart,
  createSvg,
  drawPanelFrame,
  getChartSize,
  hideTooltip,
  moveTooltip,
  showTooltip,
} from '../../shared/d3/d3-chart.utils';

type ShapeStackPoint = d3.SeriesPoint<StackedTopicDatum> & { key: StackTopicKey };

@Component({
  selector: 'app-shape-studio-chart',
  standalone: true,
  templateUrl: './shape-studio-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShapeStudioChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() refreshKey = 0;
  @ViewChild('chartHost', { static: true }) private chartHost!: ElementRef<HTMLDivElement>;
  @ViewChild('tooltip', { static: true }) private tooltip!: ElementRef<HTMLDivElement>;

  private readonly segments: ShapeDatum[];
  private readonly stackedRows: StackedTopicDatum[];
  private readonly stackKeys: StackTopicKey[] = ['line', 'arc', 'stack'];
  private resizeObserver?: ResizeObserver;
  private viewReady = false;

  constructor(
    dataService: RoadmapDataService,
    private readonly zone: NgZone,
  ) {
    this.segments = dataService.getShapeSegments();
    this.stackedRows = dataService.getStackedTopicData();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.render();

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

  private render(): void {
    if (!this.viewReady) {
      return;
    }

    const host = this.chartHost.nativeElement;
    const tooltip = this.tooltip.nativeElement;
    clearChart(host);
    hideTooltip(tooltip);

    const size = getChartSize(host, { minHeight: 560, fallbackHeight: 560 });
    const svg = createSvg(host, size, 'Shape generator studio with donut and stacked charts');
    const compact = size.width < 760;
    const gutter = 22;
    const donutBox = compact
      ? { x: 18, y: 34, width: size.width - 36, height: Math.round(size.height * 0.48) }
      : { x: 24, y: 44, width: Math.round((size.width - 70) * 0.42), height: size.height - 86 };
    const stackBox = compact
      ? {
          x: 18,
          y: donutBox.y + donutBox.height + gutter,
          width: size.width - 36,
          height: size.height - donutBox.y - donutBox.height - gutter - 24,
        }
      : {
          x: donutBox.x + donutBox.width + gutter,
          y: 44,
          width: size.width - donutBox.width - gutter - 48,
          height: size.height - 86,
        };

    drawPanelFrame(svg, donutBox, 'Pie and arc generators');
    drawPanelFrame(svg, stackBox, 'Stack generator');
    this.drawDonut(svg, donutBox);
    this.drawStackedBars(svg, stackBox);
  }

  private drawDonut(svg: SvgSelection, box: ChartBox): void {
    const host = this.chartHost.nativeElement;
    const tooltip = this.tooltip.nativeElement;
    const radius = Math.max(54, Math.min(box.width - 44, box.height - 126) / 2);
    const centerX = box.x + box.width / 2;
    const centerY = box.y + 58 + radius;
    const pie = d3.pie<ShapeDatum>().sort(null).value((datum) => datum.value);
    const arc = d3
      .arc<d3.PieArcDatum<ShapeDatum>>()
      .innerRadius(radius * 0.56)
      .outerRadius(radius);
    const labelArc = d3
      .arc<d3.PieArcDatum<ShapeDatum>>()
      .innerRadius(radius * 0.76)
      .outerRadius(radius * 0.76);
    const total = d3.sum(this.segments, (datum) => datum.value);
    const group = svg.append('g').attr('transform', `translate(${centerX},${centerY})`);

    group
      .selectAll<SVGPathElement, d3.PieArcDatum<ShapeDatum>>('path')
      .data(pie(this.segments), (datum) => datum.data.name)
      .join('path')
      .attr('fill', (datum) => datum.data.color)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, datum) =>
        showTooltip(
          tooltip,
          host,
          event,
          datum.data.name,
          `${Math.round((datum.data.value / total) * 100)}% of generator practice`,
        ),
      )
      .on('mousemove', (event) => moveTooltip(tooltip, host, event))
      .on('mouseleave', () => hideTooltip(tooltip))
      .transition()
      .duration(760)
      .ease(d3.easeCubicOut)
      .attrTween('d', (datum) => {
        const startDatum: d3.PieArcDatum<ShapeDatum> = { ...datum, endAngle: datum.startAngle };
        const interpolate = d3.interpolate(startDatum, datum);
        return (time) => arc(interpolate(time)) ?? '';
      });

    group
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -4)
      .attr('fill', '#111827')
      .attr('font-size', 26)
      .attr('font-weight', 900)
      .text(String(total));
    group
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 18)
      .attr('fill', '#64748b')
      .attr('font-size', 11)
      .attr('font-weight', 800)
      .text('practice pts');

    group
      .selectAll<SVGTextElement, d3.PieArcDatum<ShapeDatum>>('text.slice-label')
      .data(pie(this.segments).filter((datum) => datum.endAngle - datum.startAngle > 0.35))
      .join('text')
      .attr('class', 'slice-label')
      .attr('transform', (datum) => `translate(${labelArc.centroid(datum).join(',')})`)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', 11)
      .attr('font-weight', 900)
      .text((datum) => `${Math.round((datum.data.value / total) * 100)}%`);

    const legend = svg
      .append('g')
      .attr('transform', `translate(${box.x + 22},${box.y + box.height - this.segments.length * 20 - 14})`);
    const legendItem = legend
      .selectAll<SVGGElement, ShapeDatum>('g')
      .data(this.segments)
      .join('g')
      .attr('transform', (_, index) => `translate(0,${index * 20})`);

    legendItem.append('rect').attr('width', 10).attr('height', 10).attr('rx', 3).attr('fill', (datum) => datum.color);
    legendItem
      .append('text')
      .attr('x', 17)
      .attr('y', 9)
      .attr('fill', '#334155')
      .attr('font-size', 11)
      .attr('font-weight', 800)
      .text((datum) => datum.name);
  }

  private drawStackedBars(svg: SvgSelection, box: ChartBox): void {
    const host = this.chartHost.nativeElement;
    const tooltip = this.tooltip.nativeElement;
    const margin = { top: 48, right: 20, bottom: 42, left: 44 };
    const width = box.width - margin.left - margin.right;
    const height = box.height - margin.top - margin.bottom;
    const group = svg.append('g').attr('transform', `translate(${box.x + margin.left},${box.y + margin.top})`);
    const stack = d3.stack<StackedTopicDatum, StackTopicKey>().keys(this.stackKeys)(this.stackedRows);
    const maxValue = d3.max(stack, (series) => d3.max(series, (point) => point[1])) ?? 0;
    const x = d3
      .scaleBand()
      .domain(this.stackedRows.map((row) => row.label))
      .range([0, width])
      .padding(0.2);
    const y = d3.scaleLinear().domain([0, maxValue]).nice().range([height, 0]);
    const color = d3
      .scaleOrdinal<StackTopicKey, string>()
      .domain(this.stackKeys)
      .range(['#0f766e', '#f97316', '#7c3aed']);

    group
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .call((axis) => axis.select('.domain').attr('stroke', '#cbd5e1'))
      .call((axis) => axis.selectAll('text').attr('fill', '#64748b'));

    group
      .append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call((axis) => axis.select('.domain').remove())
      .call((axis) => axis.selectAll('line').attr('stroke', '#d8e0ea'))
      .call((axis) => axis.selectAll('text').attr('fill', '#64748b'));

    group
      .selectAll<SVGGElement, d3.Series<StackedTopicDatum, StackTopicKey>>('g.layer')
      .data(stack)
      .join('g')
      .attr('class', 'layer')
      .attr('fill', (series) => color(series.key))
      .selectAll<SVGRectElement, ShapeStackPoint>('rect')
      .data((series) => series.map((point) => Object.assign(point, { key: series.key })))
      .join('rect')
      .attr('x', (point) => x(point.data.label) ?? 0)
      .attr('width', x.bandwidth())
      .attr('y', y(0))
      .attr('height', 0)
      .attr('rx', 4)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, point) =>
        showTooltip(
          tooltip,
          host,
          event,
          `${point.data.label} · ${point.key}`,
          `${point.data[point.key]} practice points`,
        ),
      )
      .on('mousemove', (event) => moveTooltip(tooltip, host, event))
      .on('mouseleave', () => hideTooltip(tooltip))
      .transition()
      .delay((_, index) => index * 35)
      .duration(540)
      .ease(d3.easeCubicOut)
      .attr('y', (point) => y(point[1]))
      .attr('height', (point) => Math.max(0, y(point[0]) - y(point[1])));

    const legend = svg.append('g').attr('transform', `translate(${box.x + margin.left},${box.y + box.height - 18})`);
    const legendItem = legend
      .selectAll<SVGGElement, StackTopicKey>('g')
      .data(this.stackKeys)
      .join('g')
      .attr('transform', (_, index) => `translate(${index * 92},0)`);
    legendItem.append('rect').attr('width', 10).attr('height', 10).attr('rx', 3).attr('fill', (key) => color(key));
    legendItem
      .append('text')
      .attr('x', 16)
      .attr('y', 9)
      .attr('fill', '#334155')
      .attr('font-size', 11)
      .attr('font-weight', 800)
      .text((key) => key);
  }
}
