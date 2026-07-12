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
import { LineDatum } from '../../core/models/roadmap.models';
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
  selector: 'app-line-chart',
  standalone: true,
  templateUrl: './line-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() refreshKey = 0;
  @ViewChild('chartHost', { static: true }) private chartHost!: ElementRef<HTMLDivElement>;
  @ViewChild('tooltip', { static: true }) private tooltip!: ElementRef<HTMLDivElement>;

  private readonly data: LineDatum[];
  private resizeObserver?: ResizeObserver;
  private viewReady = false;

  constructor(
    dataService: RoadmapDataService,
    private readonly zone: NgZone,
  ) {
    this.data = dataService.getLineData();
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

    const size = getChartSize(host);
    const margin = { top: 34, right: 30, bottom: 58, left: 58 };
    const plotTop = margin.top;
    const plotRight = size.width - margin.right;
    const plotBottom = size.height - margin.bottom;
    const plotLeft = margin.left;
    const svg = createSvg(host, size, 'Interactive time-series line chart');
    const formatDate = d3.timeFormat('%b %d');

    const x = d3
      .scaleTime()
      .domain(d3.extent(this.data, (datum) => datum.date) as [Date, Date])
      .range([plotLeft, plotRight]);
    const y = d3
      .scaleLinear()
      .domain([0, Math.max(100, d3.max(this.data, (datum) => datum.score) ?? 0)])
      .nice()
      .range([plotBottom, plotTop]);

    const line = d3
      .line<LineDatum>()
      .x((datum) => x(datum.date))
      .y((datum) => y(datum.score))
      .curve(d3.curveMonotoneX);
    const area = d3
      .area<LineDatum>()
      .x((datum) => x(datum.date))
      .y0(size.height - margin.bottom)
      .y1((datum) => y(datum.score))
      .curve(d3.curveMonotoneX);

    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'lineGradient')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '0%')
      .attr('y2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#2dd4bf').attr('stop-opacity', 0.34);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#2dd4bf').attr('stop-opacity', 0);

    svg
      .append('g')
      .attr('transform', `translate(0,${plotBottom})`)
      .call(d3.axisBottom<Date>(x).ticks(5).tickFormat(formatDate))
      .call((group) => group.select('.domain').attr('stroke', '#cbd5e1'))
      .call((group) => group.selectAll('line').attr('stroke', '#d8e0ea'))
      .call((group) => group.selectAll('text').attr('fill', '#64748b'));

    svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat((datum) => `${datum}%`))
      .call((group) => group.select('.domain').remove())
      .call((group) => group.selectAll('line').attr('stroke', '#d8e0ea'))
      .call((group) => group.selectAll('text').attr('fill', '#64748b'));

    svg.append('path').datum(this.data).attr('fill', 'url(#lineGradient)').attr('d', area);

    const path = svg
      .append('path')
      .datum(this.data)
      .attr('fill', 'none')
      .attr('stroke', '#0f766e')
      .attr('stroke-width', 4)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', line);

    const length = path.node()?.getTotalLength() ?? 0;
    path
      .attr('stroke-dasharray', `${length} ${length}`)
      .attr('stroke-dashoffset', length)
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    svg
      .append('g')
      .selectAll('circle')
      .data(this.data)
      .join('circle')
      .attr('cx', (datum) => x(datum.date))
      .attr('cy', (datum) => y(datum.score))
      .attr('r', 5)
      .attr('fill', '#f97316')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2.5)
      .on('mouseenter', (event, datum) =>
        showTooltip(tooltip, host, event, datum.label, `${formatDate(datum.date)} · ${datum.score}%`),
      )
      .on('mousemove', (event) => moveTooltip(tooltip, host, event))
      .on('mouseleave', () => hideTooltip(tooltip));

    const focus = svg.append('g').attr('display', 'none');
    const focusLine = focus
      .append('line')
      .attr('y1', plotTop)
      .attr('y2', plotBottom)
      .attr('stroke', '#0f766e')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 4')
      .attr('opacity', 0.65);
    const focusCircle = focus
      .append('circle')
      .attr('r', 8)
      .attr('fill', '#f97316')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3)
      .attr('filter', 'drop-shadow(0 5px 10px rgba(15, 23, 42, 0.24))');
    const bisectDate = d3.bisector<LineDatum, Date>((datum) => datum.date).left;
    const getNearestDatum = (cursorX: number): LineDatum => {
      const hoveredDate = x.invert(cursorX);
      const nextIndex = bisectDate(this.data, hoveredDate, 1);
      const previous = this.data[nextIndex - 1];
      const next = this.data[nextIndex];

      if (!next) {
        return previous;
      }

      return hoveredDate.getTime() - previous.date.getTime() > next.date.getTime() - hoveredDate.getTime()
        ? next
        : previous;
    };
    const updateFocus = (event: MouseEvent): void => {
      const [cursorX] = d3.pointer(event, svg.node());
      const datum = getNearestDatum(Math.max(plotLeft, Math.min(plotRight, cursorX)));
      const focusX = x(datum.date);
      const focusY = y(datum.score);

      focus.attr('display', null);
      focusLine.attr('x1', focusX).attr('x2', focusX);
      focusCircle.attr('cx', focusX).attr('cy', focusY);
      showTooltip(tooltip, host, event, datum.label, `${formatDate(datum.date)} · ${datum.score}%`);
    };

    svg
      .append('rect')
      .attr('x', plotLeft)
      .attr('y', plotTop)
      .attr('width', plotRight - plotLeft)
      .attr('height', plotBottom - plotTop)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair')
      .on('mouseenter', updateFocus)
      .on('mousemove', updateFocus)
      .on('mouseleave', () => {
        focus.attr('display', 'none');
        hideTooltip(tooltip);
      });

    addAxisLabel(svg, margin.left - 42, margin.top + 16, 'Score');
    addAxisLabel(svg, size.width / 2, size.height - 16, 'Week 2 practice days');
  }
}
