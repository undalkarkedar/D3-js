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
import {
  addAxisLabel,
  clearChart,
  createSvg,
  drawPanelFrame,
  getChartSize,
  hideTooltip,
  moveTooltip,
  showTooltip,
} from '../../shared/d3/d3-chart.utils';

interface StreamDatum {
  time: Date;
  value: number;
}

@Component({
  selector: 'app-zoom-realtime-chart',
  standalone: true,
  templateUrl: './zoom-realtime-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoomRealtimeChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() refreshKey = 0;
  @ViewChild('chartHost', { static: true }) private chartHost!: ElementRef<HTMLDivElement>;
  @ViewChild('tooltip', { static: true }) private tooltip!: ElementRef<HTMLDivElement>;

  private readonly maxPoints = 30;
  private data: StreamDatum[] = [];
  private intervalId?: number;
  private resizeObserver?: ResizeObserver;
  private tickIndex = 0;
  private viewReady = false;
  private zoomTransform = d3.zoomIdentity;

  constructor(private readonly zone: NgZone) {
    this.data = this.createSeedData();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.render();

    this.zone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => this.render());
      this.resizeObserver.observe(this.chartHost.nativeElement);
      this.intervalId = window.setInterval(() => {
        this.pushPoint();
        this.render();
      }, 1200);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.viewReady && changes['refreshKey']) {
      this.zoomTransform = d3.zoomIdentity;
      window.requestAnimationFrame(() => this.render());
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }
  }

  private createSeedData(): StreamDatum[] {
    const start = Date.now() - (this.maxPoints - 1) * 1000;
    return d3.range(this.maxPoints).map((index) => ({
      time: new Date(start + index * 1000),
      value: this.signalValue(index),
    }));
  }

  private pushPoint(): void {
    this.tickIndex += 1;
    const previous = this.data[this.data.length - 1];
    const nextTime = previous ? previous.time.getTime() + 1000 : Date.now();
    this.data = [
      ...this.data,
      {
        time: new Date(nextTime),
        value: this.signalValue(this.maxPoints + this.tickIndex),
      },
    ].slice(-this.maxPoints);
  }

  private signalValue(index: number): number {
    return Math.round(52 + Math.sin(index / 2.7) * 18 + Math.cos(index / 5.4) * 9);
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
    const svg = createSvg(host, size, 'Zoomable real-time line chart');
    const box = { x: 24, y: 44, width: size.width - 48, height: size.height - 86 };
    const margin = { top: 44, right: 32, bottom: 54, left: 58 };
    const width = box.width - margin.left - margin.right;
    const height = box.height - margin.top - margin.bottom;
    const formatTime = d3.timeFormat('%H:%M:%S');
    const extent = d3.extent(this.data, (datum) => datum.time);
    if (!extent[0] || !extent[1]) {
      return;
    }

    drawPanelFrame(svg, box, 'Zoom, pan, and streaming data');

    const defs = svg.append('defs');
    defs
      .append('clipPath')
      .attr('id', 'streamClip')
      .append('rect')
      .attr('width', width)
      .attr('height', height);

    const xBase = d3.scaleTime().domain([extent[0], extent[1]]).range([0, width]);
    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);
    const group = svg.append('g').attr('transform', `translate(${box.x + margin.left},${box.y + margin.top})`);
    const grid = group.append('g').attr('stroke', '#e2e8f0');
    const xAxis = group.append('g').attr('transform', `translate(0,${height})`);
    const yAxis = group.append('g');
    const chartLayer = group.append('g').attr('clip-path', 'url(#streamClip)');
    const areaPath = chartLayer.append('path').attr('fill', 'rgba(45, 212, 191, 0.2)');
    const linePath = chartLayer
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', '#0f766e')
      .attr('stroke-width', 3)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round');
    const latestMarker = chartLayer.append('circle').attr('r', 6).attr('fill', '#f97316').attr('stroke', '#ffffff').attr('stroke-width', 2);
    const status = svg
      .append('text')
      .attr('x', box.x + 18)
      .attr('y', box.y + 31)
      .attr('fill', '#64748b')
      .attr('font-size', 11)
      .attr('font-weight', 800);

    const drawSeries = (transform: d3.ZoomTransform): void => {
      const x = transform.rescaleX(xBase);
      const line = d3
        .line<StreamDatum>()
        .x((datum) => x(datum.time))
        .y((datum) => y(datum.value))
        .curve(d3.curveMonotoneX);
      const area = d3
        .area<StreamDatum>()
        .x((datum) => x(datum.time))
        .y0(height)
        .y1((datum) => y(datum.value))
        .curve(d3.curveMonotoneX);
      const latest = this.data[this.data.length - 1];

      grid
        .selectAll('line')
        .data(y.ticks(5))
        .join('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', (tick) => y(tick))
        .attr('y2', (tick) => y(tick));
      xAxis
        .call(d3.axisBottom<Date>(x).ticks(5).tickFormat(formatTime))
        .call((axis) => axis.select('.domain').attr('stroke', '#cbd5e1'))
        .call((axis) => axis.selectAll('line').attr('stroke', '#d8e0ea'))
        .call((axis) => axis.selectAll('text').attr('fill', '#64748b'));
      yAxis
        .call(d3.axisLeft(y).ticks(5).tickFormat((tick) => `${tick}%`))
        .call((axis) => axis.select('.domain').remove())
        .call((axis) => axis.selectAll('line').attr('stroke', '#d8e0ea'))
        .call((axis) => axis.selectAll('text').attr('fill', '#64748b'));
      areaPath.datum(this.data).attr('d', area);
      linePath.datum(this.data).attr('d', line);

      if (latest) {
        latestMarker.attr('cx', x(latest.time)).attr('cy', y(latest.value));
        status.text(`Latest ${latest.value}% at ${formatTime(latest.time)}`);
      }
    };

    const zoom = d3
      .zoom<SVGRectElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .extent([
        [0, 0],
        [width, height],
      ])
      .on('zoom', (event) => {
        this.zoomTransform = event.transform;
        drawSeries(event.transform);
      });

    drawSeries(this.zoomTransform);

    group
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .attr('cursor', 'grab')
      .on('mousemove', (event) => {
        const [cursorX] = d3.pointer(event, group.node());
        const x = this.zoomTransform.rescaleX(xBase);
        const hoveredTime = x.invert(Math.max(0, Math.min(width, cursorX)));
        const nearest = d3.least(this.data, (datum) => Math.abs(datum.time.getTime() - hoveredTime.getTime()));
        if (nearest) {
          showTooltip(tooltip, host, event, formatTime(nearest.time), `${nearest.value}% streaming signal`);
        }
      })
      .on('mouseleave', () => hideTooltip(tooltip))
      .call(zoom);

    const reset = svg
      .append('g')
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('aria-label', 'Reset zoom')
      .attr('transform', `translate(${box.x + box.width - 92},${box.y + 15})`)
      .attr('cursor', 'pointer')
      .on('click', () => this.resetZoom())
      .on('keydown', (event: KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }

        event.preventDefault();
        this.resetZoom();
      });

    reset.append('rect').attr('width', 72).attr('height', 26).attr('rx', 7).attr('fill', '#e2e8f0');
    reset
      .append('text')
      .attr('x', 36)
      .attr('y', 17)
      .attr('text-anchor', 'middle')
      .attr('fill', '#111827')
      .attr('font-size', 11)
      .attr('font-weight', 900)
      .text('Reset');

    addAxisLabel(svg, box.x + margin.left - 40, box.y + margin.top + 16, 'Signal');
    addAxisLabel(svg, box.x + box.width / 2, box.y + box.height - 15, 'Live time window');
  }

  private resetZoom(): void {
    this.zoomTransform = d3.zoomIdentity;
    this.render();
  }
}
